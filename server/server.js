import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import http from "http";
import { initializeSocket } from "./src/socket.js";
import  "./src/config/redis.js";

const server=http.createServer(app);

initializeSocket(server);
 
const PORT=process.env.PORT ;

const startServer=async ()=>{
    await connectDB();
     
    server.listen(PORT,()=>{
        console.log(`server running on port ${PORT}`);
    });
};

startServer();
