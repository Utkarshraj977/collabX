import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, sendMessages, addNewMessage } from "../features/messages/messageSlice";
import { Sparkles, Github, Paperclip, FileText, Download, Loader2 } from "lucide-react";
import { io } from "socket.io-client";
import { triggerManualSummary } from "../services/api"; 
import toast from "react-hot-toast";

// STEP 1: Global Socket Variable
let socket;

export default function Chat({ channelId }) {
    const dispatch = useDispatch();

    // UI References
    const containerRef = useRef(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const lastScrollHeight = useRef(0);

    // State Management
    const [input, setInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingOld, setIsFetchingOld] = useState(false);

    const { messages, loading } = useSelector((state) => state.message);
    const { user } = useSelector((state) => state.auth);

    // STEP 2: Channel Change Hone Par Reset & Initial Fetch
    useEffect(() => {
        if (!channelId) return;

        setPage(1);
        setHasMore(true);
        setIsFetchingOld(false);

        dispatch(fetchMessages({ channelId, page: 1 }));
    }, [dispatch, channelId]);


    useEffect(() => {
        const userToken = user?.token || user?.refreshtoken;
        // Basic validation
        if (!userToken || !channelId) return;

        // A. Connection Initialize (Singleton Pattern)
        if (!socket) {
            socket = io(import.meta.env.MAIN_URL, { 
                auth: { token: userToken },
                transports: ["websocket","polling"],
            }); 
        }

        // B. Room Join Logic
        const joinChannelRoom = () => {
            socket.emit("join-channel", channelId);
        };

        if (socket.connected) {
            joinChannelRoom();
        } else {
            socket.on("connect", joinChannelRoom);
        }

        // C. Message Handler
        const handleNewMessage = (newMessage) => {

            // 1. IDs ko string mein convert karein
            const msgChannelId = newMessage.channelId?.toString();
            const currentChannelId = channelId.toString();

            if (msgChannelId === currentChannelId) {

                // 2. AI check: Agar type 'ai' hai ya senderId null hai
                const isAI = newMessage.type === 'ai' || !newMessage.senderId;

                // 3. Me check: Kya ye mera message hai?
                // Agar senderId object hai toh ._id lo, agar string hai toh direct use karo
                const senderIdStr = newMessage.senderId?._id?.toString() || newMessage.senderId?.toString();
                const isNotMe = senderIdStr !== user?._id?.toString();

                // ✅ Logic: Agar AI message hai OR kisi aur ka message hai, toh add karo
                if (isAI || isNotMe) {
                    dispatch(addNewMessage(newMessage));

                    // Auto Scroll
                    setTimeout(() => {
                        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                } 

            } else {
                console.error("❌ Message kisi aur channel ka hai.");
            }
        };

        socket.off("new-message");

        socket.on("new-message", handleNewMessage);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("connect", joinChannelRoom);
        };

    }, [channelId, user?._id, dispatch]); 

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight } = e.target;

        if (scrollTop === 0 && hasMore && !loading && !isFetchingOld) {
            setIsFetchingOld(true);
            lastScrollHeight.current = scrollHeight;

            const nextPage = page + 1;
            setPage(nextPage);

            dispatch(fetchMessages({ channelId, page: nextPage }))
                .unwrap()
                .then((res) => {
                    if (!res.messages || res.messages.length === 0) setHasMore(false);
                    setIsFetchingOld(false);
                })
                .catch(() => setIsFetchingOld(false));
        }
    };

    useLayoutEffect(() => {
        if (isFetchingOld && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            const diff = newScrollHeight - lastScrollHeight.current;
            containerRef.current.scrollTop = diff;
        }
        else if (page === 1 && messages.length > 0 && !isFetchingOld) {
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [messages.length, isFetchingOld]); // dependency on messages.length is more stable


    // STEP 6: Send Message Logic
   const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    //  "/summarize" ya "/summarize(30)"
    const commandRegex = /^\/summarize(?:\((\d+)\))?$/i;
    const match = input.trim().match(commandRegex);

    if (match) {
        // Agar ye command hai...
        const limit = match[1] ? parseInt(match[1]) : 10; // Default 10 agar number nahi diya

        // 1. Input clear karo (User ko lage command chali gayi)
        setInput(""); 

        try {
            // 2. Direct API Call karo (Redux ki zaroorat nahi)
            // Backend khud AI run karega aur Socket se jawab bhejega
            await triggerManualSummary(channelId, limit);
        } catch (error) {
            toast.error("something went wrong!!");
            // Optional: Toast error dikha sakte ho
        }
        
        // 🛑 RETURN: Yahi ruk jao, neeche wala normal message logic mat chalao
        return; 
    }

    const messageData = {
        content: input,
        channelId,
        file: selectedFile
    };

    await dispatch(sendMessages(messageData));

    setInput("");
    setSelectedFile(null);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
};

    const handleFileClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); };

    if (loading && messages.length === 0 && page === 1) {
        return <div className="flex items-center justify-center h-full text-gray-500">Loading messages...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#121016]">
            {/* Messages Container */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {isFetchingOld && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="animate-spin text-gray-500" size={20} />
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                    const isBot = msg.type === 'ai';
                    const isGithub = msg.type === 'github';
                    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    let senderName = msg.senderId?.name || "User";
                    let AvatarIcon = null;

                    if (isBot) {
                        senderName = "Gemini AI";
                        AvatarIcon = <Sparkles size={16} className="text-blue-400" />;
                    } else if (isGithub) {
                        senderName = "GitHub";
                        AvatarIcon = <Github size={16} className="text-white" />;
                    } else {
                        AvatarIcon = msg.senderId?.avatarUrl ?
                            <img src={msg.senderId.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" /> :
                            <span className="text-xs font-bold text-gray-300">{senderName.charAt(0).toUpperCase()}</span>;
                    }

                    return (
                        <div key={msg._id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-700 ${isBot ? 'bg-blue-900/50 border-blue-500' : isGithub ? 'bg-gray-900 border-gray-500' : 'bg-gray-800'}`}>
                                        {AvatarIcon}
                                    </div>
                                )}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && (
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-xs font-bold text-gray-400">{senderName}</span>
                                            <span className="text-[10px] text-gray-600">{time}</span>
                                        </div>
                                    )}
                                    <div className={`px-3 py-2 text-sm leading-relaxed break-words ${isMe ? 'bg-[#0066ff] text-white rounded-2xl rounded-tr-sm' : 'bg-[#2b2d31] text-gray-200 rounded-2xl rounded-tl-sm'}`}>
                                        {msg.content}
                                        {msg.metadata?.fileUrl && (
                                            <div className="mt-2 group relative">
                                                {msg.metadata.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                    <a href={msg.metadata.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <img src={msg.metadata.fileUrl} alt="attachment" className="max-w-full rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition" style={{ maxHeight: "200px" }} />
                                                    </a>
                                                ) : (
                                                    <a href={msg.metadata.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/20 p-2 rounded hover:bg-black/40 transition">
                                                        <FileText size={20} />
                                                        <span className="underline text-blue-300 text-xs">View File</span>
                                                        <Download size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {isMe && <span className="text-[10px] text-gray-600 mt-1 mr-1">{time}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-[#15171c] border-t border-gray-800">
                <form onSubmit={handleSendMessage} className="bg-[#22252a] border border-gray-700 rounded-xl flex items-center p-2 shadow-lg focus-within:border-blue-500 transition-colors">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={handleFileClick} className={`p-2 transition ${selectedFile ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}>
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={selectedFile ? `File: ${selectedFile.name}` : `Message #${channelId}`}
                        className="flex-1 bg-transparent text-white px-4 focus:outline-none placeholder:text-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() && !selectedFile}
                        className={`p-2 rounded-lg transition-all ${input.trim() || selectedFile ? 'bg-blue-600 text-white hover:scale-105' : 'bg-gray-800 text-gray-500'}`}
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}