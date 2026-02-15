import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
    if (socket) return socket;

    socket = io(import.meta.env.VITE_MAIN_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        console.warn(" Socket not initialized yet!");
        return null;
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

