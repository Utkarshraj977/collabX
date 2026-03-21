import React, { useEffect, useRef } from 'react';
import { useVideo } from '../components/VideoContext1'; // adjust path as needed
import { getSocket } from '../services/socket';

export default function Meet1({ channelId }) {
    const { startLocalStream, stream, joinRoom, callActive, isSocketReady } = useVideo();
    const videoRef = useRef();
    const socket   = getSocket();

    // Show camera preview before joining
    useEffect(() => {
        if (!callActive) {
            startLocalStream().then((mediaStream) => {
                if (videoRef.current && mediaStream) {
                    videoRef.current.srcObject = mediaStream;
                }
            });
        }
        // ✅ cleanup: stop preview tracks when component unmounts or call starts
        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [callActive]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleJoin = () => {
        if (isSocketReady && socket) {
            socket.emit('notify-meeting-started', { channelId, userName: 'Someone' });
            joinRoom(channelId, socket);
        }
    };

    if (callActive) {
        return (
            <div className="flex h-full items-center justify-center text-gray-400">
                Meeting in progress...
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0b0c10] text-white">
            <h1 className="text-3xl font-bold mb-6">Ready to Join?</h1>

            {/* Camera preview */}
            <div className="w-[500px] h-[350px] bg-black rounded-xl overflow-hidden mb-6 border border-gray-800">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
            </div>

            <button
                onClick={handleJoin}
                disabled={!isSocketReady || !stream}
                className="px-10 py-4 rounded-full text-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
            >
                {isSocketReady ? 'Join Now' : 'Connecting...'}
            </button>
        </div>
    );
}