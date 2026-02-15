import Message from "../models/Message.js";
import Channel from "../models/Channel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIO } from "../socket.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { triggerAutoSummary } from "./ai.controller.js";

const sendmessage = asyncHandler(async (req, res) => {
    const { content, channelId } = req.body;
    const senderId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    let fileUrl = null;
    let fileType = 'text';

    if (req.file) {
        const result = await uploadOnCloudinary(req.file.path);
        fileUrl = result.secure_url;
        fileType = 'file';
    }

    const messageData = {
        content: content || "",
        type: fileType,
        senderId: senderId,
        channelId: channelId,
        workspaceId: channel.workspaceId,

        metadata: {
            fileUrl: fileUrl,
            githubEventId: null
        }
    };

    let message = await Message.create(messageData);

    message = await message.populate("senderId", "name avatarUrl email");
    const io = getIO();
    io.to(channelId.toString()).emit("new-message", message);


    try {
        const messageCount = await Message.countDocuments({ channelId });
        
        if (messageCount > 0 && messageCount % 10 === 0) {
            triggerAutoSummary(channelId, channel.workspaceId);
        }
    } catch (err) {
        console.error(" Auto-summary trigger check failed:", err);
    }

    return res.status(201).json({
        success: true,
        data: message
    });
});


const getmessage = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ channelId })
        .populate("senderId", "name avatarUrl email")
        .populate({
            path: "metadata.githubEventId", 
            model: "GitHubEvent",
            select: "payload eventType actor" 
        }) 
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const reversedMessages = messages.reverse();
 
    return res.status(200).json({
        success: true,
        data: reversedMessages
    });
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
        return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only delete your own messages" });
    }

    message.content = "This message was deleted";
    if (message.metadata) {
        message.metadata.fileUrl = null;
    }
    message.isDeleted = true;
    await message.save();

    const io = getIO();
    io.to(message.channelId.toString()).emit("message-deleted", {
        messageId: message._id,
        channelId: message.channelId
    });

    return res.status(200).json({ success: true, message: "Message deleted" });
});


const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { newContent } = req.body;
    const userId = req.user._id;

    if (!newContent) return res.status(400).json({ message: "Content is required" });

    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.content = newContent;
    //message.isEdited = true;
    await message.save();

    const io = getIO();
    io.to(message.channelId.toString()).emit("message-updated", {
        messageId: message._id,
        content: message.content,
        channelId: message.channelId,
        isEdited: true
    });

    return res.status(200).json({ success: true, data: message });
});

export { sendmessage, getmessage, deleteMessage, editMessage };

