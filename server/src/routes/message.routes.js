import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { sendmessage, getmessage, deleteMessage, editMessage } from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();
router.use(verifyJWT);


router.route("/createmessage").post(
    upload.single("file"), 
    sendmessage
);
router.get("/:channelId/getmessage", getmessage);
router.delete("/:messageId/deletemessage", deleteMessage);
router.put("/:messageId/editmessage", editMessage);

export default router; 


