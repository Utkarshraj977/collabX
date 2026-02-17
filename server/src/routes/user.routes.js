import { Router } from "express";
import { register, login,logout, refreshAccessToken,getMyProfile } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter,generalLimiter } from "../middlewares/rateLimiter.middleware.js";
const router = Router();

router.route("/register").post(authLimiter,upload.single("avatar"), register);
router.route("/login").post(authLimiter,login);
router.route("/logout").post(verifyJWT, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/getmyprofile").get(authLimiter,verifyJWT, getMyProfile);

export default router;
