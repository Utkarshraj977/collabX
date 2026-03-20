import React, { useEffect, useRef, useState } from 'react';
import { useVideo } from '../components/VideoContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Optional icon

export default function Meet({ channelId }) { // isSocketReady hata diya kyunki context se le rahe hain
    
    // ✅ Context se sab kuch access karein
    const { 
        joinRoom, 
        callActive,  
        startLocalStream, 
        stream, // Use global stream instead of local state
        isSocketReady 
    } = useVideo();

    const videoRef = useRef();
    const navigate = useNavigate();

    // 1. Mount hote hi camera start karo (Preview)
    useEffect(() => {
        if (callActive) return;

        const initCamera = async () => {
            const mediaStream = await startLocalStream();
            if (mediaStream && videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        };

        initCamera();

        // Note: Cleanup hum nahi kar rahe kyunki yahi stream Call mein use hogi
    }, [callActive, startLocalStream]); // Dependency safe

    // ✅ Handle Join
    const handleJoin = () => {
        if (isSocketReady) {
            joinRoom(channelId);
        }
    };

    // ✅ Call Active Screen (Agar user join ho gaya)
    if (callActive) {
        return (
            <div className="flex items-center justify-center h-full bg-[#121016] text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <h1 className="text-xl font-semibold">Connecting to Room...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0b0c10] text-white">
            <h1 className="text-3xl font-bold mb-6">Ready to Join?</h1>
            
            <div className="w-[500px] h-[350px] bg-black rounded-xl overflow-hidden mb-6 border border-gray-800 relative">
                {/* Preview Video */}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                />
                
                {/* Agar stream load ho rahi ho */}
                {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <p className="text-gray-400">Loading Camera...</p>
                    </div>
                )}
            </div>

            <button 
                onClick={handleJoin}
                disabled={!isSocketReady || !stream}
                className={`px-10 py-4 rounded-full text-xl font-bold transition shadow-lg flex items-center gap-2
                    ${isSocketReady && stream 
                        ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer' 
                        : 'bg-gray-700 cursor-not-allowed text-gray-400'}`}
            >
                {isSocketReady ? "Join Now" : "Connecting..."}
            </button>
        </div>
    );
}
