import { Router } from "express";
import { register, login,logout, refreshAccessToken,getMyProfile } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatar"), register);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/getmyprofile").get(verifyJWT, getMyProfile);

export default router;
