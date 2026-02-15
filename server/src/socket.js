import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import User from './models/User.js';
import WorkspaceMember from './models/WorkspaceMember.js';
import redis from './config/redis.js';

let io;

const initializeSocket = (httpServer) => {
    // 1. Redis connection for Socket Adapter (Scaling)
    const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    const subClient = pubClient.duplicate();

    // 2. Setup IO with Correct CORS
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL ,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.adapter(createAdapter(pubClient, subClient));

    // 3. Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token ||
                socket.handshake.headers.cookie?.split('accessToken=')[1];

            if (!token) return next(new Error("Authentication error"));

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("name avatar email");

            if (!user) return next(new Error("User not found"));

            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Invalid Token"));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();
        console.log(`🟢 User Connected: ${socket.user.name} (${socket.id})`);

        // --- A. CHAT LOGIC ---
        socket.on("join-channel", (channelId) => {
            socket.join(channelId.toString());
            console.log(`💬 Joined Chat Channel: ${channelId}`);
        });

        socket.on("typing", (channelId) => {
            socket.to(channelId).emit("typing", socket.user.name);
        });

        // --- B. VIDEO MEET LOGIC (WebRTC Signaling) ---

        // 1. Join Video Room & Get Existing Users
        socket.on("join-room", (roomId) => {
            socket.join(roomId);

            // Get all socket IDs in this room
            const clients = io.sockets.adapter.rooms.get(roomId);

            // Convert Set to Array and remove SELF (don't call yourself)
            const users = clients ? Array.from(clients).filter(id => id !== socket.id) : [];

            // Send list of users to the NEW person so they can initiate calls
            socket.emit("all-users", users);

            console.log(`📹 Joined Video Room: ${roomId} | Existing Users: ${users.length}`);
        });

        // 2. Relay Offer (New User -> Existing User)
        socket.on("sending-signal", payload => {
            // Payload contains: { userToSignal, callerID, signal }
            io.to(payload.userToSignal).emit('user-joined', {
                signal: payload.signal,
                callerID: payload.callerID
            });
        });

        // 3. Relay Answer (Existing User -> New User)
        socket.on("returning-signal", payload => {
            // Payload contains: { signal, callerID }
            io.to(payload.callerID).emit('receiving-returned-signal', {
                signal: payload.signal,
                id: socket.id
            });
        });

        // --- C. DISCONNECT & CLEANUP ---
        socket.on("disconnect", async () => {
            console.log(`🔴 Disconnecting: ${socket.user.name}`);

            // Notify others that this user left (Helper for video cleanup)
            socket.broadcast.emit("user-left", socket.id);

            // Redis Status Update
            await redis.hset(`user:session:${userId}`, "status", "offline");
            if (socket.workspaceIds) {
                for (const id of socket.workspaceIds) {
                    await redis.srem(`workspace:${id}:online`, userId);
                }
            }
            io.emit("user-status", { userId, status: "offline" });
        });

        // --- D. ONLINE STATUS INIT ---
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