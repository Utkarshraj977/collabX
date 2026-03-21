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
        },
        // ✅ FIX: Render kills idle connections — these settings keep WS alive
        pingTimeout: 60000,   // wait 60s before declaring connection dead
        pingInterval: 25000,  // send a ping every 25s automatically
    });

    io.adapter(createAdapter(pubClient, subClient));

    // ─── AUTH MIDDLEWARE (unchanged) ─────────────────────────────────
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

    // ─── CONNECTION ───────────────────────────────────────────────────
    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();

        // ── Channel / Chat ────────────────────────────────────────────
        socket.on("join-channel", (channelId) => {
            socket.join(channelId.toString());
        });

        socket.on("typing", (channelId) => {
            socket.to(channelId).emit("typing", socket.user.name);
        });

        // ── Heartbeat (manual ping from frontend as extra safety) ─────
        // Socket.io already sends its own pings via pingInterval above,
        // but we keep this for the manual heartbeat in VideoContext.
        socket.on('ping', () => {
            socket.emit('pong');
        });

        // ── VIDEO MEET: Join Room ─────────────────────────────────────
        socket.on("join-room", (roomId) => {
            socket.join(roomId);

            // ✅ Track which video room this socket is in
            // so disconnecting handler can clean up correctly
            socket.currentVideoRoom = roomId;

            // Send list of existing users (everyone except the joiner)
            const clients = io.sockets.adapter.rooms.get(roomId);
            const existingUsers = clients
                ? Array.from(clients).filter(id => id !== socket.id)
                : [];

            socket.emit("all-users", existingUsers);
        });

        // ── VIDEO MEET: WebRTC Signaling ──────────────────────────────
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

        // ── VIDEO MEET: ICE Candidates ────────────────────────────────
        socket.on("ice-candidate", (data) => {
            io.to(data.targetId).emit("incoming-ice-candidate", {
                senderId: socket.id,
                candidate: data.candidate
            });
        });

        // ── VIDEO MEET: Leave Room (intentional) ─────────────────────
        socket.on("leave-room", (roomId) => {
            socket.to(roomId).emit("user-left", socket.id);
            socket.leave(roomId);
            socket.currentVideoRoom = null; // ✅ clear the tracked room
        });

        // ── VIDEO MEET: Meeting notification ─────────────────────────
        socket.on("notify-meeting-started", ({ channelId, userName }) => {
            socket.to(channelId).emit("meeting-is-live", {
                message: `${userName} started a video meeting!`,
                channelId: channelId
            });
        });

        // ── DISCONNECT: Tab close / network drop ─────────────────────
        // "disconnecting" fires BEFORE the socket leaves its rooms,
        // so socket.rooms still has the room IDs at this point.
        // ✅ FIX: Only emit user-left for VIDEO rooms, not every channel room.
        //         We use socket.currentVideoRoom to target the right room.
        socket.on("disconnecting", () => {
            if (socket.currentVideoRoom) {
                socket.to(socket.currentVideoRoom).emit("user-left", socket.id);
            }
        });

        // "disconnect" fires AFTER the socket has left all rooms.
        socket.on("disconnect", async () => {
            // Redis Status Update (Offline)
            try {
                await redis.hset(`user:session:${userId}`, "status", "offline");
                if (socket.workspaceIds) {
                    for (const id of socket.workspaceIds) {
                        await redis.srem(`workspace:${id}:online`, userId);
                    }
                }
                io.emit("user-status", { userId, status: "offline" });
            } catch (err) {
                console.error("❌ Disconnect cleanup error:", err.message);
            }
        });

        // ── ONLINE STATUS INIT ────────────────────────────────────────
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
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

export { initializeSocket, getIO };