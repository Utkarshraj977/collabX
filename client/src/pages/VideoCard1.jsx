import React, { useEffect, useRef } from 'react';

const VideoCard1 = ({ stream, isLocal }) => {
    const videoRef = useRef();

    // जब भी 'stream' डेटा आएगा, यह useEffect उसे Video Tag के अंदर डाल देगा
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
                // IMPORTANT: अपनी खुद की वीडियो हमेशा Mute रखनी चाहिए, वर्ना भयानक Echo (गूँज) होगी!
                muted={isLocal} 
                className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`} 
            />
            
            {/* अगर वीडियो लोड हो रही है तो Loading दिखाएं */}
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Loading Video...</p>
                </div>
            )}
        </div>
    );
};

export default VideoCard1;
