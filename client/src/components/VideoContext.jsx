import React, { createContext, useState, useRef, useContext, useEffect } from 'react';
import { getSocket } from '../services/socket';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';

const VideoContext = createContext();

// 🛑 POLYFILL FIX FOR VITE (Prevents simple-peer crash)
if (typeof global === "undefined") { window.global = window; }

export const VideoProvider = ({ children, isSocketReady }) => {
    
    // --- STATE ---
    const [callActive, setCallActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
     
    const [peers, setPeers] = useState([]); 
    const [stream, setStream] = useState(null); // Active Stream (Webcam or Screen)
    const [screenSharing, setScreenSharing] = useState(false);
    
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);

    const myVideo = useRef();
    const peersRef = useRef([]); // Keeps track of peer connections
    const webcamStreamRef = useRef(); // ✅ Backup for webcam stream
    const screenTrackRef = useRef(); 

    // ✅ START CAMERA (Internal Helper)
    const startLocalStream = async () => {
        try {
            // Always get a fresh stream when joining
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            setStream(currentStream);
            webcamStreamRef.current = currentStream; // Save backup
            
            if (myVideo.current) myVideo.current.srcObject = currentStream;
            return currentStream;
        } catch (error) {
            console.error("Camera Error:", error);
            toast.error("Could not access Camera/Mic");
            return null;
        }
    };

    // --- MAIN JOIN LOGIC ---
    const joinRoom = async (channelId) => {
        const socket = getSocket();
        if (!socket || !isSocketReady) {
            toast.error("Connecting to server...");
            return;
        }

        const currentStream = await startLocalStream();
        if (!currentStream) return;

        setCallActive(true);
        setIsMinimized(false);

        // 🧹 Cleanup listeners to prevent double-firing
        socket.off("all-users");
        socket.off("sending-signal"); 
        socket.off("returning-signal");
        socket.off("user-left");

        // Step 1: Tell Server "I am here"
        socket.emit("join-room", channelId);

        // Step 2: Handle Existing Users (I Call Them)
        socket.on("all-users", (users) => {
            const peersList = [];
            users.forEach(userID => {
                // 🛑 FIX 1: CLIENT SIDE GHOST CHECK
                if (userID === socket.id) return;

                // 🛑 FIX 2: DUPLICATE CHECK
                if (peersRef.current.find(p => p.peerID === userID)) return;

                const peer = createPeer(userID, socket.id, currentStream, socket);
                peersRef.current.push({ peerID: userID, peer });
                peersList.push({ peerID: userID, peer, stream: null });
            });
            setPeers(peersList);
        });

        // Step 3: Handle Incoming Call (They Call Me)
        socket.on("sending-signal", payload => {
            // Check duplicate
            if (peersRef.current.find(p => p.peerID === payload.callerID)) return;

            const peer = addPeer(payload.signal, payload.callerID, currentStream, socket);
            peersRef.current.push({ peerID: payload.callerID, peer });
            setPeers(prev => [...prev, { peerID: payload.callerID, peer, stream: null }]);
        });

        // Step 4: Handle Answer
        socket.on("returning-signal", payload => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) {
                item.peer.signal(payload.signal);
            }
        });

        // Step 5: User Left
        socket.on("user-left", id => {
            const peerObj = peersRef.current.find(p => p.peerID === id);
            if(peerObj) peerObj.peer.destroy();
            const newPeers = peersRef.current.filter(p => p.peerID !== id);
            peersRef.current = newPeers;
            setPeers(newPeers);
        });
    };

    // --- PEER HELPERS ---
    
    // 1. INITIATOR (Caller)
    function createPeer(userToSignal, callerID, stream, socket) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("sending-signal", { userToSignal, callerID, signal });
        });

        peer.on("stream", remoteStream => {
            updatePeerStream(userToSignal, remoteStream);
        });

        return peer;
    }

    // 2. RECEIVER (Answerer)
    function addPeer(incomingSignal, callerID, stream, socket) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("returning-signal", { signal, callerID });
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

    // --- 🛑 ROBUST SCREEN SHARE LOGIC ---
    const handleScreenShare = async () => {
        // A. STOP SHARING
        if (screenSharing) {
            const screenTrack = screenTrackRef.current;
            if (screenTrack) screenTrack.stop();
            screenTrackRef.current = null;
            setScreenSharing(false);

            // Restore Webcam
            const webcamStream = webcamStreamRef.current;
            const webcamVideoTrack = webcamStream.getVideoTracks()[0];
            
            if (webcamVideoTrack) {
                peersRef.current.forEach(({ peer }) => {
                    // Find sender and replace track NATIVELY
                    const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
                    if (sender) sender.replaceTrack(webcamVideoTrack);
                });
            }

            setStream(webcamStream);
            if (myVideo.current) myVideo.current.srcObject = webcamStream;
            
        } 
        // B. START SHARING
        else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;
                setScreenSharing(true);

                // Listen for "Stop Sharing" via browser UI
                screenTrack.onended = () => handleScreenShare(); 

                peersRef.current.forEach(({ peer }) => {
                    // Replace Webcam Track with Screen Track NATIVELY
                    const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });

                // Update Local View
                const newLocalStream = new MediaStream([screenTrack, ...webcamStreamRef.current.getAudioTracks()]);
                setStream(newLocalStream);
                if (myVideo.current) myVideo.current.srcObject = newLocalStream;

            } catch (err) {
                console.error("Screen Share Failed", err);
            }
        }
    };

    // --- CONTROLS ---
    const leaveCall = () => {
        // Stop all tracks
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (webcamStreamRef.current) webcamStreamRef.current.getTracks().forEach(track => track.stop());
        
        // Destroy peers
        peersRef.current.forEach(p => p.peer.destroy());
        peersRef.current = [];
        setPeers([]);
        setStream(null);
        setCallActive(false);
        
        // Full refresh to ensure clean socket state
        window.location.reload(); 
    };

    const toggleAudio = () => {
        // Toggle on backup stream to persist through screen share
        if (webcamStreamRef.current) {
            const track = webcamStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMicOn(track.enabled);
            }
        }
    };

    const toggleVideo = () => {
        // Only toggle video if NOT screen sharing
        if (!screenSharing && webcamStreamRef.current) {
            const track = webcamStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoOn(track.enabled);
            }
        }
    };

    return (
        <VideoContext.Provider value={{
            callActive, isMinimized, setIsMinimized,
            stream, peers, myVideo,
            joinRoom, leaveCall, startLocalStream,
            toggleAudio, toggleVideo, handleScreenShare,
            isMicOn, isVideoOn, screenSharing, isSocketReady
        }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);