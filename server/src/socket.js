import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import User from './models/User.js';
import WorkspaceMember from './models/WorkspaceMember.js';
import redis from './config/redis.js';

let io;

const initializeSocket = (httpServer) => {
    const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    const subClient = pubClient.duplicate();

    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL, 
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.adapter(createAdapter(pubClient, subClient));

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token ||
                socket.handshake.headers.cookie
                    ?.split('; ')
                    .find(c => c.toLowerCase().startsWith('accesstoken='))
                    ?.split('=')[1];

            if (!token) return next(new Error("Authentication error"));

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("name avatar email");

            if (!user) return next(new Error("User not found"));

            socket.user = user;
            next();
        } catch (error) {
            console.error("Socket Auth Error:", error.message);
            next(new Error("Invalid Token"));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();

        socket.on("join-channel", (channelId) => {
            socket.join(channelId.toString());
        });

        socket.on("typing", (channelId) => {
            socket.to(channelId).emit("typing", socket.user.name);
        });

        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            const clients = io.sockets.adapter.rooms.get(roomId);
            const users = clients ? Array.from(clients).filter(id => id !== socket.id) : [];
            socket.emit("all-users", users);
        });

        socket.on("call-user", (data) => {
            io.to(data.targetId).emit("incoming-call", {
                callerId: socket.id, 
                offer: data.offer
            });
        });

        socket.on("call-accepted", (data) => {
            io.to(data.targetId).emit("call-answered", {
                answererId: socket.id, 
                answer: data.answer
            });
        });

        socket.on("leave-room", (roomId) => {
            socket.leave(roomId); // यूज़र को रूम से बाहर निकालो
            // रूम में बचे हुए बाकी लोगों को बता दो कि यह यूज़र चला गया
            socket.to(roomId).emit("user-left", socket.id); 
        });
        
        // 4. Relay ICE Candidates (The Network Paths - Fixes the Black Screen!)
        socket.on("ice-candidate", (data) => {
            io.to(data.targetId).emit("incoming-ice-candidate", {
                senderId: socket.id,
                candidate: data.candidate
            });
        });

        // --- END OF VIDEO MEET LOGIC ---

        // Inside your io.on("connection") block:

        socket.on("notify-meeting-started", ({ channelId, userName }) => {
            // socket.to() sends it to everyone in that channel EXCEPT the sender
            socket.to(channelId).emit("meeting-is-live", {
                message: `${userName} started a video meeting!`,
                channelId: channelId
            });
        });

        // --- DISCONNECT & CLEANUP ---

        // 🛑 FIX: Handle room leaving explicitly
        socket.on("disconnecting", () => {
            const rooms = [...socket.rooms];
            rooms.forEach((roomId) => {
                socket.leave(roomId);
                socket.to(roomId).emit("user-left", socket.id);
            });
        });

        socket.on("disconnect", async () => {
            // Redis Status Update (Offline)
            await redis.hset(`user:session:${userId}`, "status", "offline");
            if (socket.workspaceIds) {
                for (const id of socket.workspaceIds) {
                    await redis.srem(`workspace:${id}:online`, userId);
                }
            }
            io.emit("user-status", { userId, status: "offline" });
        });

        // --- ONLINE STATUS INIT ---
        try {
            await redis.hset(`user:session:${userId}`, {
                name: socket.user.name,
                avatar: socket.user.avatar || "",
                email: socket.user.email,
                status: "online"
            });
            await redis.expire(`user:session:${userId}`, 86400);

            const memberships = await WorkspaceMember.find({ userId }).select("workspaceId");
            const workspaceIds = memberships.map(m => m.workspaceId.toString());

            for (const id of workspaceIds) {
                await redis.sadd(`workspace:${id}:online`, userId);
            }
            socket.workspaceIds = workspaceIds;
            io.emit("user-status", { userId, status: "online" });

        } catch (err) {
            console.error("❌ Background Task Error:", err.message);
        }
    });

    return io;
}

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

export { initializeSocket, getIO };