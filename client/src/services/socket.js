import { io } from "socket.io-client";

let socket;

export const connectSocket = () => {
    // 1. Agar socket pehle se connected hai, wahi return karo
    if (socket && socket.connected) {
        return socket;
    }

    // 2. Naya socket initialize karo (par connect mat karo abhi)
    if (!socket) {
        socket = io(import.meta.env.VITE_MAIN_URL, {
            withCredentials: true,      // ✅ Cookies bhejne ke liye
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            autoConnect: false,         // 🛡️ Safety Lock: Khud se connect mat hona
        });
    }

    // 3. Ab manually connect karo
    socket.connect();

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        // Console warn hata diya taaki unnecessary logs na aayein
        return null;
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null; // Pura clean kar diya
    }
};