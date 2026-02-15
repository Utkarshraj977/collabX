import React, { useEffect, useRef, useState } from 'react';
import { useVideo } from '../components/VideoContext';
import { useNavigate } from 'react-router-dom';

export default function Meet({ channelId }) {
    const { joinRoom, callActive } = useVideo();
    const [localStream, setLocalStream] = useState(null);
    const videoRef = useRef();
    const navigate = useNavigate();

    // Lobby ke liye sirf local stream lo (Preview)
    useEffect(() => {
        // Agar call pehle se chal rahi hai, to wapas Chat/Home bhej do ya kuch mat karo
        if (callActive) return;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                setLocalStream(stream);
                if(videoRef.current) videoRef.current.srcObject = stream;
            });
            
        return () => {
            // Cleanup sirf preview stream ka, actual call stream Context handle karega
            if(localStream) localStream.getTracks().forEach(t => t.stop());
        };
    }, [callActive]);

    const handleJoin = () => {
        // 1. Call Start Karo (Global Overlay activate hoga)
        joinRoom(channelId);
        
        // 2. (Optional) User ko Chat page par bhej do peeche background mein
        // navigate('/chat'); 
    };

    if (callActive) {
        return (
            <div className="flex items-center justify-center h-full text-white">
                <h1>Call is Active in Overlay...</h1>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0b0c10] text-white">
            <h1 className="text-3xl font-bold mb-6">Ready to Join?</h1>
            
            <div className="w-[500px] h-[350px] bg-black rounded-xl overflow-hidden mb-6 border border-gray-800">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>

            <button 
                onClick={handleJoin}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-xl font-bold transition shadow-lg"
            >
                Join Now
            </button>
        </div>
    );
}