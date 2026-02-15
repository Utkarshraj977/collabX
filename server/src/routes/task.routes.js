import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"; 
import {
    createTask,
    getChannelTasks,
    updateTaskStatus,
    deleteTask
} from "../controllers/task.controller.js";

const router = Router();
 
router.use(verifyJWT);

router.route("/createtask").post(createTask);
router.route("/gettask/:channelId").get(getChannelTasks);
router.route("/:taskId/updatetask").patch(updateTaskStatus);
router.route("/:taskId/deletetask").delete(deleteTask);

export default router;
