import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from "../models/Message.js";
import AISummary from "../models/AISummary.js";
import ChannelMember from "../models/ChannelMember.js";
import Channel from "../models/Channel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIO } from "../socket.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const triggerAutoSummary = async (channelId, workspaceId) => {
    try {

        const messages = await Message.find({ channelId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("senderId", "name");

        if (messages.length < 5) return;

        // Chat history format wahi rahega
        const chatHistory = [...messages].reverse().map(msg => {
            const sender = msg.senderId ? msg.senderId.name : "System";
            return `${sender}: ${msg.content}`;
        }).join("\n");

        // 🔥 IMPROVED PROMPT START 🔥
        const prompt = `
        You are a strict Project Manager. Convert the following chat history into a sequence-wise list of action points.
        
        **Rules for Output:**
        1. **NO Story Mode:** Do not write paragraphs or long sentences.
        2. **Line-by-Line:** Every distinct task, deadline, or meeting must be on a new line.
        3. **Highlighting:** Use **Bold** for Dates, Times, and Names.
        4. **Icons:** Use emojis to categorize (📅 for Deadlines, 📢 for Meetings, ✅ for Tasks, ✈️ for Leave).
        5. **Sequence:** Keep the order of events as they happened in the chat.
        
        **Chat History:**
        ${chatHistory}
        `;
        // 🔥 IMPROVED PROMPT END 🔥

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // 🛑 SAVE & EMIT LOGIC
        // (Isme maine wo fake senderId wala fix bhi daal diya hai taaki frontend crash na ho)
        const [summary, aiMessage] = await Promise.all([
            AISummary.create({
                workspaceId,
                channelId,
                requestedBy: null, // Schema update ke hisaab se
                generatedFor: 'auto_summary', // Schema enum check kar lena
                content: aiResponse
            }),

            Message.create({
                channelId,
                workspaceId,
                type: 'ai',
                content: aiResponse, // "Auto-Summary" prefix hata diya, AI khud clean dega
                senderId: null
            })
        ]);

        const io = getIO();

        // Frontend Crash Fix Payload
        const socketPayload = {
            _id: aiMessage._id,
            content: aiMessage.content,
            channelId: channelId.toString(),
            workspaceId: workspaceId.toString(),
            type: 'ai',
            createdAt: aiMessage.createdAt,
            senderId: {
                _id: "ai_bot_summary",
                name: "AI Summary",
                avatarUrl: ""
            }
        };

        io.to(channelId.toString()).emit("new-message", socketPayload);

    } catch (error) {
        console.error("❌ Auto-Summary Failed:", error);
    }
};


const summarizeChat = asyncHandler(async (req, res) => {
    const { channelId, limit = 10 } = req.body;
 
    const member = await ChannelMember.findOne({ channelId, userId: req.user._id });
  
    if (!member) {
        return res.status(403).json({ message: "You are not a member of this channel" });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
    }

    const workspaceId = channel.workspaceId;

    // B. Fetch Messages
    const messages = await Message.find({ channelId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("senderId", "name");

    if (messages.length === 0) {
        return res.status(400).json({ message: "No messages to summarize" });
    }

    // C. Prepare Prompt
    const chatHistory = [...messages].reverse().map(msg => {
        const sender = msg.senderId ? msg.senderId.name : "System";
        return `${sender}: ${msg.content}`;
    }).join("\n");

    const prompt = `
        You are a strict Project Manager. Convert the following chat history into a sequence-wise list of action points.
        
        **Rules for Output:**
        1. **NO Story Mode:** Do not write paragraphs or long sentences.
        2. **Line-by-Line:** Every distinct task, deadline, or meeting must be on a new line.
        3. **Highlighting:** Use **Bold** for Dates, Times, and Names.
        4. **Icons:** Use emojis to categorize (📅 for Deadlines, 📢 for Meetings, ✅ for Tasks, ✈️ for Leave).
        5. **Sequence:** Keep the order of events as they happened in the chat.
        
        **Chat History:**
        ${chatHistory}
        `;

    // D. Call AI
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // E. Save to DB
    const [summary, aiMessage] = await Promise.all([
        AISummary.create({
            workspaceId,
            channelId,
            requestedBy: req.user._id, // User ka ID save karo jisne request kiya
            generatedFor: 'messages',
            content: aiResponse
        }),
        Message.create({
            channelId,
            workspaceId,
            type: 'ai',
            content: aiResponse,
            senderId: null
        })
    ]);

    // F. Socket Emit
    const io = getIO();
    io.to(channelId.toString()).emit("new-message", aiMessage);

    // G. Response to User
    return res.status(200).json({ success: true, summary: aiResponse });
});

// Dono ko export karo
export { summarizeChat, triggerAutoSummary };