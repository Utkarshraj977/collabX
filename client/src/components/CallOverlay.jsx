import React, { useEffect, useRef } from 'react';
import { useVideo } from './VideoContext';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Minimize2, Maximize2, MonitorUp, XSquare } from 'lucide-react';

const VideoCard = ({ stream }) => {
    const ref = useRef();
    useEffect(() => {
        if (ref.current && stream) ref.current.srcObject = stream;
    }, [stream]);

    return (
        <div className="w-full h-full bg-black relative">
            <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
            {!stream && <div className="absolute inset-0 flex items-center justify-center text-white text-xs">Connecting...</div>}
        </div>
    );
};

const CallOverlay = () => {
    const { 
        callActive, isMinimized, setIsMinimized, stream, peers, myVideo,
        leaveCall, toggleAudio, toggleVideo, handleScreenShare,
        isMicOn, isVideoOn, screenSharing 
    } = useVideo();

    // Local Video Logic (Ensure view updates on screen share)
    useEffect(() => {
        if (callActive && myVideo.current) {
            // If screen sharing, userVideo srcObject is set in handleScreenShare
            // If NOT screen sharing, ensure it's the webcam stream
            if (!screenSharing && stream) {
                myVideo.current.srcObject = stream;
            }
        }
    }, [stream, callActive, isMinimized, screenSharing]);

    if (!callActive) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 w-60 h-40 bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl z-[9999] overflow-hidden">
                <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                <button onClick={() => setIsMinimized(false)} className="absolute top-2 right-2 bg-black/60 p-1 rounded text-white hover:bg-black">
                    <Maximize2 size={18} />
                </button>
            </div>
        );
    }

    const totalUsers = peers.length + 1;
    let gridClass = "grid-cols-1";
    if (totalUsers === 2) gridClass = "grid-cols-1 md:grid-cols-2"; 
    if (totalUsers >= 3) gridClass = "grid-cols-2";

    return (
        <div className="fixed inset-0 bg-[#0b0c10] z-[5000] flex flex-col">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setIsMinimized(true)} className="bg-gray-800/80 p-2 rounded-full text-white hover:bg-gray-700">
                    <Minimize2 />
                </button>
            </div>

            <div className={`flex-1 grid ${gridClass} gap-4 p-4 overflow-hidden`}>
                {/* MY VIDEO */}
                <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 w-full h-full">
                    <video 
                        playsInline 
                        muted 
                        ref={myVideo} 
                        autoPlay 
                        className={`w-full h-full object-cover ${screenSharing ? '' : 'transform scale-x-[-1]'}`} 
                    />
                    <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {screenSharing ? "You (Sharing)" : "You"}
                    </span>
                </div>

                {/* REMOTE USERS */}
                {peers.map((p, i) => (
                    <div key={p.peerID} className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 w-full h-full">
                        <VideoCard stream={p.stream} />
                        <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">User {i+1}</span>
                    </div>
                ))}
            </div>

            {/* CONTROLS */}
            <div className="h-20 bg-[#1a1b1e] border-t border-gray-800 flex items-center justify-center gap-6 shrink-0">
                <button onClick={toggleAudio} className={`p-4 rounded-full transition ${isMicOn ? 'bg-gray-700' : 'bg-red-600'}`}>
                    {isMicOn ? <Mic className="text-white"/> : <MicOff className="text-white"/>}
                </button>
                <button onClick={toggleVideo} className={`p-4 rounded-full transition ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}>
                    {isVideoOn ? <VideoIcon className="text-white"/> : <VideoOff className="text-white"/>}
                </button>
                <button onClick={handleScreenShare} className={`p-4 rounded-full transition ${screenSharing ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    {screenSharing ? <XSquare className="text-white"/> : <MonitorUp className="text-white"/>}
                </button>
                <button onClick={leaveCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition">
                    <PhoneOff />
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;