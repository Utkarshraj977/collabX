import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    addRepository, 
    handleWebhook ,
    getConnectedRepos
} from "../controllers/github.controller.js";

const router = Router();


router.post("/connect", verifyJWT, addRepository);
router.post("/webhook", handleWebhook);
router.get("/:channelId/repos", verifyJWT, getConnectedRepos);

export default router;

