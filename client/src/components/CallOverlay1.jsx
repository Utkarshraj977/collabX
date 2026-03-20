import React from 'react';
import { useVideo } from './VideoContext1';
import VideoCard1 from '../pages/VideoCard1';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Minimize2, MonitorUp, XSquare } from 'lucide-react';

const CallOverlay = () => {
    const { 
        callActive, isMinimized, setIsMinimized, 
        stream, peers, leaveCall, 
        toggleAudio, toggleVideo, handleScreenShare, // Screen share functions
        isMicOn, isVideoOn, screenSharing 
    } = useVideo();

    if (!callActive) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 w-60 h-40 z-[9999] cursor-pointer shadow-2xl rounded-xl border-2 border-gray-700" onClick={() => setIsMinimized(false)}>
                <VideoCard1 stream={stream} isLocal={true} />
            </div>
        );
    }

    // ✅ RESPONSIVE GRID LOGIC
    const totalUsers = peers.length + 1; // आप + बाकी लोग
    let gridClass = "grid-cols-1"; // अगर सिर्फ 1 यूज़र है (पूरी स्क्रीन)
    
    if (totalUsers === 2) {
        gridClass = "grid-cols-1 md:grid-cols-2"; // 2 यूज़र पर आधा-आधा
    } else if (totalUsers >= 3) {
        gridClass = "grid-cols-2 md:grid-cols-3"; // 3 या उससे ज़्यादा पर ग्रिड
    }

    return (
        <div className="fixed inset-0 bg-[#0b0c10] z-[5000] flex flex-col p-4">
            
            <div className="absolute top-6 right-6 z-50">
                <button onClick={() => setIsMinimized(true)} className="bg-gray-800/80 p-3 rounded-full text-white hover:bg-gray-700 backdrop-blur-md">
                    <Minimize2 size={20} />
                </button>
            </div>

            {/* ✅ DYNAMIC GRID CONTAINER */}
            <div className={`flex-1 grid ${gridClass} gap-4 p-2 overflow-y-auto mb-4 items-center justify-center`}>
                
                {/* 1. MY VIDEO (Full Width if alone) */}
                <div className="relative w-full h-full max-h-[80vh] min-h-[300px] rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                    <VideoCard1 stream={stream} isLocal={true} />
                    <span className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-lg backdrop-blur-md">
                        {screenSharing ? "You (Sharing Screen)" : "You"}
                    </span>
                </div>

                {/* 2. EVERYONE ELSE'S VIDEO */}
                {peers.map((peerObj, index) => (
                    <div key={peerObj.peerId} className="relative w-full h-full max-h-[80vh] min-h-[300px] rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                        <VideoCard1 stream={peerObj.stream} isLocal={false} />
                        <span className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-lg backdrop-blur-md">
                            User {index + 1}
                        </span>
                    </div>
                ))}

            </div>

            {/* CONTROLS BAR */}
            <div className="h-20 bg-gray-900/80 backdrop-blur-lg border border-gray-800 rounded-2xl flex items-center justify-center gap-6 shrink-0 shadow-2xl mx-auto px-8">
                <button onClick={toggleAudio} className={`p-4 rounded-full transition-all hover:scale-110 ${isMicOn ? 'bg-gray-700' : 'bg-red-500'}`}>
                    {isMicOn ? <Mic className="text-white"/> : <MicOff className="text-white"/>}
                </button>

                <button onClick={toggleVideo} className={`p-4 rounded-full transition-all hover:scale-110 ${isVideoOn ? 'bg-gray-700' : 'bg-red-500'}`}>
                    {isVideoOn ? <VideoIcon className="text-white"/> : <VideoOff className="text-white"/>}
                </button>

                {/* ✅ SCREEN SHARE BUTTON */}
                <button onClick={handleScreenShare} className={`p-4 rounded-full transition-all hover:scale-110 ${screenSharing ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    {screenSharing ? <XSquare className="text-white"/> : <MonitorUp className="text-white"/>}
                </button>

                <button onClick={leaveCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all hover:scale-110 shadow-lg shadow-red-900/50">
                    <PhoneOff className="text-white" />
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;
