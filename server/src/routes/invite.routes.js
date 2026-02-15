import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createInviteLink, joinWorkspaceByInvite } from "../controllers/invite.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/create/:workspaceId", createInviteLink);
router.post("/join/:token", joinWorkspaceByInvite);

export default router;
 