import React, { createContext, useState, useRef, useContext, useCallback } from 'react';

const VideoContext = createContext();

// ✅ PRODUCTION: Fetch real TURN credentials from Metered.ca
const METERED_API_KEY = "ef0b486c91d855c7b088abb42f4fcc9b62ee";
const METERED_API_URL = `https://collabx.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;

// Fallback STUN-only config (used if API fetch fails)
const FALLBACK_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

const fetchPeerConfig = async () => {
    try {
        const response = await fetch(METERED_API_URL);
        const iceServers = await response.json();
        return { iceServers };
    } catch (error) {
        console.error('Failed to fetch TURN credentials, using fallback STUN only:', error);
        return FALLBACK_CONFIG;
    }
};

export const VideoProvider = ({ children, isSocketReady }) => {

    // --- UI STATES ---
    const [callActive, setCallActive]     = useState(false);
    const [isMinimized, setIsMinimized]   = useState(false);
    const [peers, setPeers]               = useState([]);
    const [stream, setStream]             = useState(null);
    const [isMicOn, setIsMicOn]           = useState(true);
    const [isVideoOn, setIsVideoOn]       = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);

    // --- REFS ---
    const webcamStreamRef  = useRef(null);
    const peersRef         = useRef([]);
    const currentRoomRef   = useRef(null);
    const socketRef        = useRef(null);
    const screenTrackRef   = useRef(null);
    const screenSharingRef = useRef(false); // ✅ FIX: avoid stale closure in onended
    const heartbeatRef     = useRef(null);  // ✅ FIX: Render WebSocket keep-alive

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    /** Start/stop heartbeat to keep Render WebSocket alive (dies after ~30s idle) */
    const startHeartbeat = useCallback((socket) => {
        stopHeartbeat();
        heartbeatRef.current = setInterval(() => {
            if (socket && socket.connected) {
                socket.emit('ping');
            }
        }, 20000); // every 20 s
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    /** Remove ALL socket listeners added during a session */
    const removeSocketListeners = useCallback((socket) => {
        if (!socket) return;
        socket.off('all-users');
        socket.off('incoming-call');
        socket.off('call-answered');
        socket.off('incoming-ice-candidate');
        socket.off('user-left');
        socket.off('pong');
    }, []);

    // ------------------------------------------------------------------
    // FEATURE 1: Get Camera & Mic
    // ------------------------------------------------------------------
    const startLocalStream = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
            webcamStreamRef.current = mediaStream;
            return mediaStream;
        } catch (error) {
            console.error('Camera Error:', error);
            return null;
        }
    }, []);

    // ------------------------------------------------------------------
    // FEATURE 2 & 3: Toggle Audio / Video
    // ------------------------------------------------------------------
    const toggleAudio = useCallback(() => {
        if (webcamStreamRef.current) {
            const audioTrack = webcamStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (webcamStreamRef.current) {
            const videoTrack = webcamStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
            }
        }
    }, []);

    // ------------------------------------------------------------------
    // SCREEN SHARE  ✅ FIX: uses ref to avoid stale closure
    // ------------------------------------------------------------------
    const handleScreenShare = useCallback(async () => {

        // A. STOP screen share
        if (screenSharingRef.current) {
            if (screenTrackRef.current) screenTrackRef.current.stop();
            screenTrackRef.current = null;
            screenSharingRef.current = false;
            setScreenSharing(false);

            const webcamTrack = webcamStreamRef.current?.getVideoTracks()[0];
            if (webcamTrack) {
                peersRef.current.forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(webcamTrack);
                });
            }
            setStream(webcamStreamRef.current);
            return;
        }

        // B. START screen share
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack  = screenStream.getVideoTracks()[0];
            screenTrackRef.current   = screenTrack;
            screenSharingRef.current = true;   // ✅ update ref first
            setScreenSharing(true);

            // ✅ FIX: onended reads from ref — no stale closure
            screenTrack.onended = () => {
                if (screenSharingRef.current) {
                    handleScreenShare();
                }
            };

            peersRef.current.forEach(({ pc }) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });

            const audioTrack   = webcamStreamRef.current?.getAudioTracks()[0];
            const localPreview = new MediaStream([screenTrack]);
            if (audioTrack) localPreview.addTrack(audioTrack);
            setStream(localPreview);

        } catch (error) {
            console.error('Screen Share cancelled or failed', error);
        }
    }, []); // no deps needed — everything via refs

    // ------------------------------------------------------------------
    // WEBRTC: Create peer connection  ✅ fetches fresh TURN creds each time
    // ------------------------------------------------------------------
    const createPeerConnection = useCallback(async (targetSocketId, myStream, socket) => {
        const config = await fetchPeerConfig();
        const pc = new RTCPeerConnection(config);
        pc.candidateQueue = [];

        if (myStream) {
            myStream.getTracks().forEach(track => pc.addTrack(track, myStream));
        }

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            setPeers(prev => prev.map(p =>
                p.peerId === targetSocketId ? { ...p, stream: remoteStream } : p
            ));
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    targetId: targetSocketId,
                    candidate: event.candidate
                });
            }
        };

        // ✅ Optional: log connection state changes for debugging
        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] ${targetSocketId} → ${pc.connectionState}`);
        };

        return pc;
    }, []);

    // ------------------------------------------------------------------
    // FEATURE 4: JOIN ROOM
    // ------------------------------------------------------------------
    const joinRoom = useCallback(async (channelId, socket) => {
        const myStream = await startLocalStream();
        if (!myStream) {
            alert('Camera/Mic permission is needed to join!');
            return;
        }

        currentRoomRef.current = channelId;
        socketRef.current      = socket;

        setCallActive(true);

        // ✅ FIX: clean up any leftover listeners before adding new ones
        removeSocketListeners(socket);

        socket.emit('join-room', channelId);

        // ✅ FIX: start heartbeat so Render doesn't kill the WS
        startHeartbeat(socket);
        socket.on('pong', () => {}); // acknowledge server pong

        // 1. You are the new joiner — call everyone already in the room
        socket.on('all-users', (existingUsers) => {
            existingUsers.forEach(async (targetSocketId) => {
                const pc = await createPeerConnection(targetSocketId, myStream, socket);
                peersRef.current.push({ peerId: targetSocketId, pc });
                setPeers(prev => [...prev, { peerId: targetSocketId, stream: null }]);

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('call-user', { targetId: targetSocketId, offer });
            });
        });

        // 2. Someone new calls YOU
        socket.on('incoming-call', async ({ callerId, offer }) => {
            const pc = await createPeerConnection(callerId, myStream, socket);
            peersRef.current.push({ peerId: callerId, pc });
            setPeers(prev => [...prev, { peerId: callerId, stream: null }]);

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call-accepted', { targetId: callerId, answer });

            while (pc.candidateQueue?.length > 0) {
                await pc.addIceCandidate(pc.candidateQueue.shift());
            }
        });

        // 3. They answered YOUR call
        socket.on('call-answered', async ({ answererId, answer }) => {
            const peerObj = peersRef.current.find(p => p.peerId === answererId);
            if (peerObj) {
                await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
                while (peerObj.pc.candidateQueue?.length > 0) {
                    await peerObj.pc.addIceCandidate(peerObj.pc.candidateQueue.shift());
                }
            }
        });

        // 4. ICE candidates
        socket.on('incoming-ice-candidate', async ({ senderId, candidate }) => {
            const peerObj = peersRef.current.find(p => p.peerId === senderId);
            if (peerObj) {
                const iceCandidate = new RTCIceCandidate(candidate);
                if (peerObj.pc.remoteDescription) {
                    await peerObj.pc.addIceCandidate(iceCandidate);
                } else {
                    peerObj.pc.candidateQueue.push(iceCandidate);
                }
            }
        });

        // 5. Someone left mid-call
        socket.on('user-left', (leftUserId) => {
            const peerObj = peersRef.current.find(p => p.peerId === leftUserId);
            if (peerObj?.pc) peerObj.pc.close();
            peersRef.current = peersRef.current.filter(p => p.peerId !== leftUserId);
            setPeers(prev => prev.filter(p => p.peerId !== leftUserId));
        });

    }, [startLocalStream, createPeerConnection, removeSocketListeners, startHeartbeat]);

    // ------------------------------------------------------------------
    // LEAVE CALL  ✅ FIX: full cleanup including listeners + heartbeat
    // ------------------------------------------------------------------
    const leaveCall = useCallback(() => {
        // 1. Stop camera/mic
        if (webcamStreamRef.current) {
            webcamStreamRef.current.getTracks().forEach(t => t.stop());
            webcamStreamRef.current = null;
        }

        // 2. Stop screen share if active
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current   = null;
            screenSharingRef.current = false;
        }

        // 3. Close all WebRTC pipes
        peersRef.current.forEach(({ pc }) => { if (pc) pc.close(); });
        peersRef.current = [];

        // 4. ✅ FIX: Remove all socket listeners to prevent memory leaks / re-fire
        removeSocketListeners(socketRef.current);

        // 5. ✅ FIX: Stop heartbeat
        stopHeartbeat();

        // 6. Tell server we left
        if (socketRef.current && currentRoomRef.current) {
            socketRef.current.emit('leave-room', currentRoomRef.current);
        }

        // 7. Reset all state
        setPeers([]);
        setStream(null);
        setIsMinimized(false);
        setCallActive(false);
        setScreenSharing(false);
        currentRoomRef.current = null;
        socketRef.current      = null;
    }, [removeSocketListeners, stopHeartbeat]);

    // ------------------------------------------------------------------
    return (
        <VideoContext.Provider value={{
            callActive,   setCallActive,
            isMinimized,  setIsMinimized,
            stream,       peers,
            isMicOn,      isVideoOn,
            screenSharing,
            isSocketReady,
            startLocalStream,
            joinRoom,
            leaveCall,
            toggleAudio,
            toggleVideo,
            handleScreenShare,
        }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);