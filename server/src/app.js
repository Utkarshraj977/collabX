import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser"
const app = express();

app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, 
    methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"] 
}));

app.use(express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
        req.rawBody = buf.toString(); 
    }
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import users from "./routes/user.routes.js";
import workspaces from './routes/workspace.routes.js';
import channels from './routes/channel.routes.js';
import invite from './routes/invite.routes.js';
import message from './routes/message.routes.js';
import task from './routes/task.routes.js';
import github from './routes/github.routes.js';
import ai from './routes/ai.routes.js';

app.use("/api/v1/users",users);
app.use("/api/v1/workspace",workspaces)
app.use("/api/v1/channel",channels)
app.use("/api/v1/invite",invite)
app.use("/api/v1/message",message);
app.use("/api/v1/tasks", task);
app.use("/api/v1/github", github);
app.use("/api/v1/ai",ai)

app.get("/", (req, res) => {
    res.json({ message: "CollabX API running" });
}); 

export default app;

