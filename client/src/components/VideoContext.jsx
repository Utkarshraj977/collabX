import React, { createContext, useState, useRef, useContext } from 'react';
import { getSocket } from '../services/socket';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';

const VideoContext = createContext();

if (typeof global === "undefined") { window.global = window; }

export const VideoProvider = ({ children }) => {
    
    // --- STATE ---
    const [callActive, setCallActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    
    const [peers, setPeers] = useState([]); 
    const [stream, setStream] = useState(null); // Always holds Local Webcam Stream
    const [screenSharing, setScreenSharing] = useState(false);
    
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);

    const myVideo = useRef();
    const peersRef = useRef([]); 
    const screenTrackRef = useRef(); // To store screen track

    // --- JOIN ROOM LOGIC ---
    const joinRoom = async (channelId) => {
        const socket = getSocket();
        if (!socket) return;

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(currentStream);
            setCallActive(true);
            setIsMinimized(false);

            socket.emit("join-room", channelId);

            // 1. EXISTING USERS
            socket.off("all-users").on("all-users", (users) => {
                const peersList = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socket.id, currentStream, socket);
                    peersRef.current.push({ peerID: userID, peer });
                    peersList.push({ peerID: userID, peer, stream: null });
                });
                setPeers(peersList);
            });

            // 2. NEW USER JOINED
            socket.off("user-joined").on("user-joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, currentStream, socket);
                peersRef.current.push({ peerID: payload.callerID, peer });
                setPeers(prev => [...prev, { peerID: payload.callerID, peer, stream: null }]);
            });

            // 3. SIGNAL RECEIVED
            socket.off("receiving-returned-signal").on("receiving-returned-signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item) item.peer.signal(payload.signal);
            });

            // 4. USER LEFT
            socket.off("user-left").on("user-left", id => {
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if(peerObj) peerObj.peer.destroy();
                const newPeers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = newPeers;
                setPeers(newPeers);
            });

        } catch (error) {
            console.error("Camera Error:", error);
        }
    };

    // --- CONTROLS ---
    
    const toggleAudio = () => {
        if (stream) {
            const track = stream.getAudioTracks()[0];
            track.enabled = !track.enabled;
            setIsMicOn(track.enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const track = stream.getVideoTracks()[0];
            track.enabled = !track.enabled;
            setIsVideoOn(track.enabled);
        }
    };

    // 🔥 SCREEN SHARE LOGIC (The Fix)
    const handleScreenShare = async () => {
        if (!screenSharing) {
            // START SHARING
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;

                // 1. Replace Webcam Track with Screen Track for ALL peers
                peersRef.current.forEach(({ peer }) => {
                    // We need to replace the track currently being sent
                    // simple-peer tracks streams, so we replace the video track inside the current stream
                    const oldTrack = stream.getVideoTracks()[0];
                    if (oldTrack) {
                        peer.replaceTrack(oldTrack, screenTrack, stream);
                    }
                });

                // 2. Update Local View (Show my screen to me)
                if (myVideo.current) {
                    myVideo.current.srcObject = screenStream;
                }
                setScreenSharing(true);

                // 3. Handle "Stop Sharing" from Browser UI
                screenTrack.onended = () => stopScreenSharing();

            } catch (err) {
                toast.error("something went wrong")
            }
        } else {
            // STOP SHARING (Button Click)
            stopScreenSharing();
        }
    };

    const stopScreenSharing = () => {
        const screenTrack = screenTrackRef.current;
        if(screenTrack) screenTrack.stop(); // Stop the screen recording
        screenTrackRef.current = null;

        // 1. Replace Screen Track with Webcam Track for ALL peers
        const webcamTrack = stream.getVideoTracks()[0];
        peersRef.current.forEach(({ peer }) => {
            // Important: We pass the 'screenTrack' as the old track to replace
            peer.replaceTrack(screenTrack, webcamTrack, stream);
        });

        // 2. Update Local View (Back to Webcam)
        if (myVideo.current) {
            myVideo.current.srcObject = stream;
        }
        setScreenSharing(false);
    };

    const leaveCall = () => {
        window.location.reload(); 
    };

    // --- PEER HELPERS ---
    function createPeer(userToSignal, callerID, stream, socket) {
        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on("signal", signal => {
            if(socket) socket.emit("sending-signal", { userToSignal, callerID, signal });
        });

        peer.on("stream", remoteStream => {
            updatePeerStream(userToSignal, remoteStream);
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream, socket) {
        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on("signal", signal => {
            if(socket) socket.emit("returning-signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        peer.on("stream", remoteStream => {
            updatePeerStream(callerID, remoteStream);
        });

        return peer;
    }

    const updatePeerStream = (peerID, remoteStream) => {
        setPeers(prevPeers => {
            return prevPeers.map(p => {
                if (p.peerID === peerID) {
                    return { ...p, stream: remoteStream }; 
                }
                return p;
            });
        });
    };

    return (
        <VideoContext.Provider value={{
            callActive, isMinimized, setIsMinimized,
            stream, peers, myVideo,
            joinRoom, leaveCall,
            toggleAudio, toggleVideo, handleScreenShare,
            isMicOn, isVideoOn, screenSharing
        }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);