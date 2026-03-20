import React from 'react';
import { useVideo } from './VideoContext';
import VideoCard from '../pages/VideoCard';
import { 
    Mic, MicOff, Video as VideoIcon, VideoOff, 
    PhoneOff, Minimize2, Maximize2, MonitorUp, XSquare 
} from 'lucide-react';

const CallOverlay = () => {
    const { 
        callActive, isMinimized, setIsMinimized, 
        stream, // This is LOCAL stream
        peers,  // These are REMOTE peers
        leaveCall, toggleAudio, toggleVideo, handleScreenShare,
        isMicOn, isVideoOn, screenSharing 
    } = useVideo();
 
    // Agar call active nahi hai to kuch mat dikhao
    if (!callActive) return null;

    // 1. Minimized View (Chhota Window)
    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 w-60 h-40 bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl z-[9999] overflow-hidden group">
                {/* Local Video Card */}
                <VideoCard stream={stream} isLocal={true} />
                
                {/* Maximize Button */}
                <button 
                    onClick={() => setIsMinimized(false)} 
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded text-white hover:bg-black opacity-0 group-hover:opacity-100 transition"
                >
                    <Maximize2 size={18} />
                </button>
            </div>
        );
    }

    // Grid Calculation
    const totalUsers = peers.length + 1; // +1 for Me
    let gridClass = "grid-cols-1";
    if (totalUsers === 2) gridClass = "grid-cols-1 md:grid-cols-2"; 
    if (totalUsers >= 3) gridClass = "grid-cols-2 md:grid-cols-3";

    return (
        <div className="fixed inset-0 bg-[#0b0c10] z-[5000] flex flex-col">
            
            {/* Header / Minimize Button */}
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setIsMinimized(true)} className="bg-gray-800/80 p-2 rounded-full text-white hover:bg-gray-700 backdrop-blur-sm">
                    <Minimize2 />
                </button>
            </div>

            {/* VIDEO GRID */}
            <div className={`flex-1 grid ${gridClass} gap-4 p-4 overflow-y-auto`}>
                
                {/* 1. MY VIDEO (Local User) */}
                <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 w-full h-full min-h-[300px]">
                    <VideoCard stream={stream} isLocal={true} />
                    
                    {/* Overlay Tag */}
                    <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                        {screenSharing ? "You (Sharing Screen)" : "You"}
                    </span>
                </div>

                {/* 2. REMOTE USERS (Peers) */}
                {peers.map((p, i) => (
                    <div key={p.peerID} className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 w-full h-full min-h-[300px]">
                        {/* Remote Video Card */}
                        <VideoCard stream={p.stream} isLocal={false} />
                        
                        <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                            Remote User {i + 1}
                        </span>
                    </div>
                ))}
            </div>

            {/* CONTROLS BAR */}
            <div className="h-20 bg-[#1a1b1e] border-t border-gray-800 flex items-center justify-center gap-6 shrink-0 shadow-lg">
                
                {/* Audio Toggle */}
                <button onClick={toggleAudio} className={`p-4 rounded-full transition-all hover:scale-110 ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isMicOn ? <Mic className="text-white"/> : <MicOff className="text-white"/>}
                </button>

                {/* Video Toggle */}
                <button onClick={toggleVideo} className={`p-4 rounded-full transition-all hover:scale-110 ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isVideoOn ? <VideoIcon className="text-white"/> : <VideoOff className="text-white"/>}
                </button>

                {/* Screen Share */}
                <button onClick={handleScreenShare} className={`p-4 rounded-full transition-all hover:scale-110 ${screenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {screenSharing ? <XSquare className="text-white"/> : <MonitorUp className="text-white"/>}
                </button>

                {/* End Call */}
                <button onClick={leaveCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all hover:scale-110 shadow-red-900/50 shadow-lg">
                    <PhoneOff />
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;
