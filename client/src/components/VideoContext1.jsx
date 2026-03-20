// import React, { createContext, useState, useRef, useContext } from 'react';

// const VideoContext = createContext();
// // 1. Google के Free STUN Servers (ताकि इंटरनेट पर डिवाइस एक-दूसरे को ढूँढ सकें)
// const peerConfiguration = {
//     iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' }
//     ]
// };

// export const VideoProvider = ({ children, isSocketReady }) => {
//     // --- UI STATES ---
//     const [callActive, setCallActive] = useState(false);
//     const [isMinimized, setIsMinimized] = useState(false);
    
//     // --- MEDIA STATES ---
//     const [stream, setStream] = useState(null); // What the world sees (Camera or Screen)
//     const [isMicOn, setIsMicOn] = useState(true);
//     const [isVideoOn, setIsVideoOn] = useState(true);

//     // --- REFS (Variables that don't trigger re-renders) ---
//     // We keep a backup of the original webcam stream in case you switch to screen-share and want to switch back
//     const webcamStreamRef = useRef(null); 
    
//     // This will hold all our Native WebRTC connections later: [{ peerId: '123', pc: RTCPeerConnection }]
//     const peersRef = useRef([]); 

//     /**
//      * FEATURE 1: Get Camera & Mic Permissions
//      * Why? We need to call this when the user clicks the "Meet" tab to show the preview.
//      */
//     const startLocalStream = async () => {
//         try {
//             // Ask the browser for native media devices
//             const mediaStream = await navigator.mediaDevices.getUserMedia({ 
//                 video: true, 
//                 audio: true 
//             });
            
//             setStream(mediaStream);
//             webcamStreamRef.current = mediaStream; // Save to backup
            
//             return mediaStream;
//         } catch (error) {
//             console.error("Camera Error:", error);
//             // Hint: Usually fails if the site isn't HTTPS or user denies permission
//             return null; 
//         }
//     };

//     /**
//      * FEATURE 2: Toggle Audio natively
//      * Why? We don't stop the stream; we just "mute" the audio track.
//      */
//     const toggleAudio = () => {
//         if (webcamStreamRef.current) {
//             // Get the first audio track (your mic)
//             const audioTrack = webcamStreamRef.current.getAudioTracks()[0];
//             if (audioTrack) {
//                 audioTrack.enabled = !audioTrack.enabled; // Toggle true/false
//                 setIsMicOn(audioTrack.enabled); // Update UI
//             }
//         }
//     };

//     /**
//      * FEATURE 3: Toggle Video natively
//      */
//     const toggleVideo = () => {
//         if (webcamStreamRef.current) {
//              // Get the first video track (your camera)
//             const videoTrack = webcamStreamRef.current.getVideoTracks()[0];
//             if (videoTrack) {
//                 videoTrack.enabled = !videoTrack.enabled;
//                 setIsVideoOn(videoTrack.enabled);
//             }
//         }
//     };

//     // --- NEW STATE: दूसरों की वीडियो स्टोर करने के लिए ---
//     // इसमें हम ऐसा डेटा रखेंगे: [{ peerId: "socketId1", stream: MediaStream }]
//     const [peers, setPeers] = useState([]); 

//     /**
//      * NATIVE WEBRTC: एक नया कनेक्शन (पाइप) बनाने का फंक्शन
//      * यह फंक्शन हर नए यूज़र के लिए एक नया पाइप बनाएगा।
//      */
//     const createPeerConnection = (targetSocketId, myStream) => {
        
//         // 1. खाली पाइप (Connection) तैयार करो
//         const pc = new RTCPeerConnection(peerConfiguration);

//         // 2. अपना वीडियो/ऑडियो इस पाइप में डालो (ताकि सामने वाले को दिखे)
//         if (myStream) {
//             myStream.getTracks().forEach(track => {
//                 pc.addTrack(track, myStream);
//             });
//         }

//         // 3. जब सामने वाला अपना वीडियो पाइप में डाले, तो उसे रिसीव करो
//         pc.ontrack = (event) => {
//             console.log("Remote Video Received from:", targetSocketId);
//             const remoteStream = event.streams[0];
            
//             // इस नई वीडियो को अपनी React State (peers) में सेव कर लो ताकि UI पर दिखे
//             setPeers(prevPeers => {
//                 // चेक करो कि क्या यह यूज़र पहले से लिस्ट में है? 
//                 const existingPeer = prevPeers.find(p => p.peerId === targetSocketId);
//                 if (existingPeer) {
//                     return prevPeers.map(p => 
//                         p.peerId === targetSocketId ? { ...p, stream: remoteStream } : p
//                     );
//                 } else {
//                     return [...prevPeers, { peerId: targetSocketId, pc: pc, stream: remoteStream }];
//                 }
//             });
//         };

//         // 4. जब ब्राउज़र इंटरनेट पर रास्ता (ICE Candidate) ढूँढ ले, तो उसे Socket के जरिये भेजो
//        pc.onicecandidate = (event) => {
//             if (event.candidate) {
//                 // SEND YOUR PUBLIC IP TO THE OTHER GUY
//                 socket.emit("ice-candidate", { 
//                     targetId: targetSocketId, 
//                     candidate: event.candidate 
//                 });
//             }
//         };

//         // अंत में इस तैयार पाइप को वापस कर दो 
//         return pc;
//     };

//     /**
//      * FEATURE 4: THE HANDSHAKE (Signaling)
//      * This function runs when you click the "Join Now" button.
//      */
//     const joinRoom = async (channelId, socket) => {
        
//         // 1. First, make sure our camera is running!
//         const myStream = await startLocalStream();
//         if (!myStream) {
//             alert("Camera needed to join!");
//             return; 
//         }

//         setCallActive(true);

//         // 2. Tell the Node.js server: "Put me in this channel's meeting room"
//         socket.emit("join-room", channelId);

//         // ==========================================
//         // SCENARIO A: YOU are the new guy joining.
//         // Server sends you a list of people already in the room.
//         // ==========================================
//         socket.on("all-users", (existingUsers) => {
//             existingUsers.forEach(async (targetSocketId) => {
                
//                 // 1. Create a pipe for this specific user
//                 const pc = createPeerConnection(targetSocketId, myStream, socket);
//                 peersRef.current.push({ peerId: targetSocketId, pc });

//                 // 2. Create an "Offer" (Hey, I support 720p video, wanna connect?)
//                 const offer = await pc.createOffer();
//                 await pc.setLocalDescription(offer); // Save it to our own pipe

//                 // 3. Send the Offer to that specific user via Socket.io
//                 socket.emit("call-user", { targetId: targetSocketId, offer });
//             });
//         });

//         // ==========================================
//         // SCENARIO B: You are ALREADY in the room, and someone calls YOU.
//         // ==========================================
//         socket.on("incoming-call", async ({ callerId, offer }) => {
            
//             // 1. Create a pipe for the new guy calling you
//             const pc = createPeerConnection(callerId, myStream, socket);
//             peersRef.current.push({ peerId: callerId, pc });

//             // 2. Accept their Offer
//             await pc.setRemoteDescription(new RTCSessionDescription(offer));

//             // 3. Create an "Answer" (Yes, I accept, here is my video format)
//             const answer = await pc.createAnswer();
//             await pc.setLocalDescription(answer);

//             // 4. Send the Answer back to the caller
//             socket.emit("call-accepted", { targetId: callerId, answer });
//         });

//         // ==========================================
//         // SCENARIO C: The guy you called answered your call!
//         // ==========================================
//         socket.on("call-answered", async ({ answererId, answer }) => {
//             // Find the pipe we created for them earlier
//             const peerObj = peersRef.current.find(p => p.peerId === answererId);
//             if (peerObj) {
//                 // Save their Answer. The Handshake is now complete!
//                 await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
//             }
//         });

//         // ==========================================
//         // THE FINAL PIECE: Receiving the Network Path (ICE Candidate)
//         // ==========================================
//         socket.on("incoming-ice-candidate", async ({ senderId, candidate }) => {
//             const peerObj = peersRef.current.find(p => p.peerId === senderId);
//             if (peerObj && peerObj.pc.remoteDescription) {
//                 // Add their public IP/Route to our pipe so video can start flowing!
//                 await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
//             }
//         });
//     };

//     // We pass all these tools down to your UI components
//     return (
//         <VideoContext.Provider value={{
//             callActive, setCallActive,
//             isMinimized, setIsMinimized,
//             stream, 
//             startLocalStream, toggleAudio, toggleVideo,
//             isMicOn, isVideoOn, isSocketReady
//         }}>
//             {children}
//         </VideoContext.Provider>
//     );
// };

// export const useVideo = () => useContext(VideoContext);








import React, { createContext, useState, useRef, useContext } from 'react';

const VideoContext = createContext();

// 1. Google's Free STUN Servers
const peerConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export const VideoProvider = ({ children, isSocketReady }) => {
    // --- UI STATES ---
    const [callActive, setCallActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    
    // --- MEDIA STATES ---
    const [stream, setStream] = useState(null); 
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);

    const webcamStreamRef = useRef(null); 
    const peersRef = useRef([]); 
    const [peers, setPeers] = useState([]); 


    // VideoContext.jsx के अंदर, जहाँ आपके बाकी states (जैसे callActive) हैं, वहाँ ये दो लाइनें डालें:
    const [screenSharing, setScreenSharing] = useState(false);
    const screenTrackRef = useRef(null); // स्क्रीन शेयर रोकने के लिए इसका रेफरेंस चाहिए

    // ... (toggleAudio, toggleVideo के ठीक नीचे यह फंक्शन डालें) ...

    /**
     * NATIVE SCREEN SHARE
     */
    const handleScreenShare = async () => {
        // A. अगर पहले से स्क्रीन शेयर हो रही है, तो उसे बंद करो
        if (screenSharing) {
            // 1. ब्राउज़र की स्क्रीन कैप्चर बंद करो
            if (screenTrackRef.current) screenTrackRef.current.stop();
            screenTrackRef.current = null;
            setScreenSharing(false);

            // 2. वापस अपना कैमरा (Webcam) उठाओ
            const webcamTrack = webcamStreamRef.current.getVideoTracks()[0];
            
            // 3. सभी मौजूदा कनेक्शन्स में स्क्रीन की जगह वापस कैमरा डाल दो!
            if (webcamTrack) {
                peersRef.current.forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) sender.replaceTrack(webcamTrack); // मैजिक SWAP 🪄
                });
            }

            // 4. अपने UI को वापस कैमरा दिखाओ
            setStream(webcamStreamRef.current);
        } 
        // B. अगर स्क्रीन शेयर चालू करनी है
        else {
            try {
                // 1. ब्राउज़र से स्क्रीन शेयर की परमिशन मांगो
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;
                setScreenSharing(true);

                // IMPORTANT: अगर यूज़र ब्राउज़र वाले "Stop Sharing" पॉपअप बटन को दबा दे
                screenTrack.onended = () => {
                    handleScreenShare(); // वापस कैमरा चालू करने वाला लॉजिक चला दो
                };

                // 2. सभी मौजूदा कनेक्शन्स में कैमरे की जगह स्क्रीन का वीडियो डाल दो!
                peersRef.current.forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack); // मैजिक SWAP 🪄
                });

                // 3. अपने UI को अपडेट करो (ताकि आपको भी अपनी स्क्रीन दिखे + आपकी आवाज़ चालू रहे)
                const audioTrack = webcamStreamRef.current.getAudioTracks()[0];
                const localPreview = new MediaStream([screenTrack]);
                if (audioTrack) localPreview.addTrack(audioTrack);
                
                setStream(localPreview);

            } catch (error) {
                console.error("Screen Share cancelled or failed", error);
            }
        }
    };
    /**
     * FEATURE 1: Get Camera & Mic Permissions
     */
    const startLocalStream = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            setStream(mediaStream);
            webcamStreamRef.current = mediaStream; 
            
            return mediaStream;
        } catch (error) {
            console.error("Camera Error:", error);
            return null; 
        }
    };

    /**
     * FEATURE 2 & 3: Toggle Audio / Video
     */
    const toggleAudio = () => {
        if (webcamStreamRef.current) {
            const audioTrack = webcamStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled; 
                setIsMicOn(audioTrack.enabled); 
            }
        }
    };

    const toggleVideo = () => {
        if (webcamStreamRef.current) {
            const videoTrack = webcamStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
            }
        }
    };

    /**
     * NATIVE WEBRTC: Create a new pipeline
     * ✅ FIX: Added 'socket' as the 3rd parameter
     */
  const createPeerConnection = (targetSocketId, myStream, socket) => {
        const pc = new RTCPeerConnection(peerConfiguration);
        
        // ✅ NEW: इस कनेक्शन के लिए एक Waiting Room (Queue) बनायें
        pc.candidateQueue = []; 

        if (myStream) {
            myStream.getTracks().forEach(track => {
                pc.addTrack(track, myStream);
            });
        }

        pc.ontrack = (event) => {
            console.log("Remote Video Received from:", targetSocketId);
            const remoteStream = event.streams[0];
            
            setPeers(prevPeers => {
                const existingPeer = prevPeers.find(p => p.peerId === targetSocketId);
                if (existingPeer) {
                    return prevPeers.map(p => 
                        p.peerId === targetSocketId ? { ...p, stream: remoteStream } : p
                    );
                } else {
                    return [...prevPeers, { peerId: targetSocketId, pc: pc, stream: remoteStream }];
                }
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { 
                    targetId: targetSocketId, 
                    candidate: event.candidate 
                });
            }
        };

        return pc;
    };

    /**
     * FEATURE 4: THE HANDSHAKE (Signaling)
     */
    const joinRoom = async (channelId, socket) => {
        const myStream = await startLocalStream();
        if (!myStream) {
            alert("Camera needed to join!");
            return; 
        }

        setCallActive(true);
        socket.emit("join-room", channelId);

        socket.on("all-users", (existingUsers) => {
            existingUsers.forEach(async (targetSocketId) => {
                // ✅ FIX: Passing 'socket' to createPeerConnection
                const pc = createPeerConnection(targetSocketId, myStream, socket);
                peersRef.current.push({ peerId: targetSocketId, pc });

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer); 

                socket.emit("call-user", { targetId: targetSocketId, offer });
            });
        });

        // ==========================================
        // SCENARIO B: You are ALREADY in the room, and someone calls YOU.
        // ==========================================
        socket.on("incoming-call", async ({ callerId, offer }) => {
            const pc = createPeerConnection(callerId, myStream, socket);
            peersRef.current.push({ peerId: callerId, pc });

            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("call-accepted", { targetId: callerId, answer });

            // ✅ QUEUE FIX: अगर कोई नेटवर्क पाथ पहले आ गया था, तो अब उसे प्रोसेस करो
            while(pc.candidateQueue && pc.candidateQueue.length > 0) {
                await pc.addIceCandidate(pc.candidateQueue.shift());
            }
        });

        // ==========================================
        // SCENARIO C: The guy you called answered your call!
        // ==========================================
        socket.on("call-answered", async ({ answererId, answer }) => {
            const peerObj = peersRef.current.find(p => p.peerId === answererId);
            if (peerObj) {
                await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
                
                // ✅ QUEUE FIX: ट्रैक तैयार है, अब पेंडिंग पाथ्स को जोड़ दो
                while(peerObj.pc.candidateQueue && peerObj.pc.candidateQueue.length > 0) {
                    await peerObj.pc.addIceCandidate(peerObj.pc.candidateQueue.shift());
                }
            }
        });

        // ==========================================
        // THE FINAL PIECE: Receiving the Network Path (ICE Candidate)
        // ==========================================
        socket.on("incoming-ice-candidate", async ({ senderId, candidate }) => {
            const peerObj = peersRef.current.find(p => p.peerId === senderId);
            if (peerObj) {
                const iceCandidate = new RTCIceCandidate(candidate);
                
                // ✅ QUEUE FIX: अगर WebRTC पाइप पूरी तरह तैयार है, तो सीधा जोड़ो
                if (peerObj.pc.remoteDescription) {
                    await peerObj.pc.addIceCandidate(iceCandidate);
                } else {
                    // अगर तैयार नहीं है, तो उसे Waiting Room (Queue) में डाल दो!
                    peerObj.pc.candidateQueue.push(iceCandidate);
                }
            }
        });
    };

    /**
     * CLEANUP: Safely end the call without crashing React
     */
    const leaveCall = () => {
        // 1. Safely turn off the Camera/Mic hardware
        if (webcamStreamRef.current) {
            webcamStreamRef.current.getTracks().forEach(track => track.stop());
            webcamStreamRef.current = null;
        }

        // 2. Safely close all WebRTC pipes
        peersRef.current.forEach(peerObj => {
            if (peerObj.pc) {
                peerObj.pc.close();
            }
        });

        // 3. Clear the arrays and states
        peersRef.current = [];
        setPeers([]);
        setStream(null);
        setIsMinimized(false);
        setCallActive(false); // This will safely return you to the Channel page

        // Optional but recommended: Tell the Node server you left
        // socket.emit("leave-room", channelId); 
    };

    // ✅ FIX: Added 'peers' and 'joinRoom' inside the value object
    return (
        <VideoContext.Provider value={{
            callActive, setCallActive,
            isMinimized, setIsMinimized,
            stream, peers,
            startLocalStream, joinRoom,leaveCall, 
            toggleAudio, toggleVideo, 
            isMicOn, isVideoOn, isSocketReady,handleScreenShare,screenSharing
        }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);
