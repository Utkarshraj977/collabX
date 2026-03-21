import React, { useEffect, useRef } from 'react';

const VideoCard1 = ({ stream, isLocal }) => {
    const videoRef = useRef();

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}   // ✅ always mute local — prevents echo
                className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`}
            />

            {/* Loading placeholder */}
            {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    {/* Simple animated avatar placeholder */}
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center animate-pulse">
                        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Connecting...</p>
                </div>
            )}
        </div>
    );
};

export default VideoCard1;