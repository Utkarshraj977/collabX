import { useEffect, useRef } from "react";

export default function VideoCard({ peer }) {
    const videoRef = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        });
    }, [peer]);

    return (
        <div className="w-full h-full relative">
            <video 
                playsInline 
                autoPlay 
                ref={videoRef} 
                className="w-full h-full object-cover"
            />
             <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-sm font-semibold text-white">Remote User</div>
        </div>
    );
}

