import React, { useEffect, useRef } from 'react';
import { useVideo } from '../components/VideoContext1'; // अपना पाथ सही कर लेना
import { getSocket } from '../services/socket';

export default function Meet1({ channelId }) { 
    // Context से सारे हथियार (tools) निकाल लो
    const { startLocalStream, stream, joinRoom, callActive, isSocketReady } = useVideo();
    const videoRef = useRef();
    const socket = getSocket();

    // 1. जैसे ही ये पेज खुले, यूजर का कैमरा चालू कर दो (Preview के लिए)
    useEffect(() => {
        if (!callActive) {
            startLocalStream().then((mediaStream) => {
                if (videoRef.current && mediaStream) {
                    videoRef.current.srcObject = mediaStream;
                }
            });
        }
    }, [callActive]);

    // 2. Join Button का Logic
    const handleJoin = () => {
        if (isSocketReady && socket) {
            // A. सबको बता दो कि मीटिंग चालू हो गई है (Notification)
            socket.emit("notify-meeting-started", { channelId, userName: "Someone" });
            
            // B. असल में WebRTC रूम ज्वाइन करो (हमारा Master Function)
            joinRoom(channelId, socket);
        }
    };

    // अगर कॉल चालू है, तो यहाँ कुछ मत दिखाओ (क्योंकि Overlay पूरे स्क्रीन पर आ जाएगा)
    if (callActive) {
        return <div className="flex h-full items-center justify-center text-gray-400">Meeting in progress...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0b0c10] text-white">
            <h1 className="text-3xl font-bold mb-6">Ready to Join?</h1>
            
            {/* Preview Box */}
            <div className="w-[500px] h-[350px] bg-black rounded-xl overflow-hidden mb-6 border border-gray-800">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>

            <button 
                onClick={handleJoin}
                disabled={!isSocketReady || !stream}
                className="px-10 py-4 rounded-full text-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 transition"
            >
                {isSocketReady ? "Join Now" : "Connecting..."}
            </button>
        </div>
    );
}