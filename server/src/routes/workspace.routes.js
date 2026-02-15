import { Router } from "express";
import { createWorkspace,getonlineusers,getUserWorkspaces,GetWorkspaceById,getWorkspaceMembers } from "../controllers/workspace.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createworkspace").post(createWorkspace);
router.route("/getuserworkspace").get(getUserWorkspaces);
router.route("/:workspaceId/online-users").post(getonlineusers);
router.route("/getworkspace/:workspaceid").get(GetWorkspaceById);
router.route("/:workspaceId/getAlluserworkspace").get(getWorkspaceMembers);
export default router;
