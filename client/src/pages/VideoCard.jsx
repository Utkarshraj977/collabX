import React, { useEffect, useRef } from 'react';

const VideoCard = ({ stream, isLocal }) => {
    const videoRef = useRef();

    useEffect(() => {
        const video = videoRef.current;
        if (video && stream) {
            video.srcObject = stream;
            
            // 🛑 FORCE PLAY LOGIC
            // Kabhi kabhi browser video ko pause kar deta hai (Black Screen)
            // Hum explicitly bolenge ki play karo.
            video.onloadedmetadata = async () => {
                try {
                    await video.play();
                } catch (e) {
                    console.error("Auto-Play Failed:", e);
                }
            };
        }  
    }, [stream]);

    return (
        <div className="w-full h-full bg-black relative rounded-xl overflow-hidden shadow-lg border border-gray-800">
            <video 
                ref={videoRef}
                playsInline 
                autoPlay 
                muted={isLocal} // Local video mute rakhna zaroori hai echo rokne ke liye
                className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`} 
            />
            
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-gray-400 text-xs">Loading Video...</p>
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white border border-white/10">
                {isLocal ? "You" : ""}
            </div>
        </div>
    );
};

export default VideoCard;
