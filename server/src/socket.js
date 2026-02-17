import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import User from './models/User.js';
import WorkspaceMember from './models/WorkspaceMember.js';
import redis from './config/redis.js';

let io;

const initializeSocket = (httpServer) => {
    // 1. Redis connection for Scaling
    const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    const subClient = pubClient.duplicate();

    // 2. Setup IO
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL, // Ensure this matches your Vite URL exactly
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.adapter(createAdapter(pubClient, subClient));

    // 3. Authentication Middleware
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
        
        // --- CHAT LOGIC ---
        socket.on("join-channel", (channelId) => {
            socket.join(channelId.toString());
        });

        socket.on("typing", (channelId) => {
            socket.to(channelId).emit("typing", socket.user.name);
        });

        // --- VIDEO MEET LOGIC (Fixed Signaling) ---

        // 1. Join Video Room & Get Existing Users
        socket.on("join-room", (roomId) => {
            socket.join(roomId);

            // Get all socket IDs in this room
            const clients = io.sockets.adapter.rooms.get(roomId);
            
            // 🛑 FIX: Filter out SELF (Server-side ghost prevention)
            const users = clients ? Array.from(clients).filter(id => id !== socket.id) : [];

            // Send list of EXISTING users to the NEW person
            socket.emit("all-users", users);

           // console.log(`📹 ${socket.user.name} joined room ${roomId}. Remote Users: ${users.length}`);
        });

        // 2. Relay Offer (New User -> Existing User)
        socket.on("sending-signal", payload => {
            // Payload: { userToSignal, callerID, signal }
            io.to(payload.userToSignal).emit('sending-signal', {
                signal: payload.signal,
                callerID: payload.callerID
            });
        });

        // 3. Relay Answer (Existing User -> New User)
        socket.on("returning-signal", payload => {
            // Payload: { signal, callerID }
            io.to(payload.callerID).emit('returning-signal', {
                signal: payload.signal,
                id: socket.id
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