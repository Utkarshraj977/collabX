import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { summarizeChat } from "../controllers/ai.controller.js";

const router = Router();

router.use(verifyJWT); // Secure all AI routes

router.post("/summarize/chat", summarizeChat);
 
export default router;