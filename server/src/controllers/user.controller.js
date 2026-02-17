import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';
import redis from "../config/redis.js";

// const options = {
//     httpOnly: true,
//     secure: false,
// } 

const options = {
        httpOnly: true,
        secure: true, 
        sameSite: 'None', 
        maxAge: 2 * 24 * 60 * 60 * 1000
};

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accesstoken = user.generateAccessToken();
        const refreshtoken = user.generateRefreshToken();
        if (!accesstoken || !refreshtoken) throw new Error("error while generating accesstoken or refreshtoken");
        user.refreshtoken = refreshtoken;
        await user.save({ validateBeforeSave: false });
        return { accesstoken, refreshtoken };
    } catch (error) {
        throw new Error("Something went wrong while generating tokens");
    }
}


const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            "message": "name email and password is required!"
        })
    }
    const exit = await User.findOne({ email });
    if (exit) return res.status(409).json({ message: "user allready exist" });
    const avatarlocalpath = req.file?.path;
    if (!avatarlocalpath) return res.status(400).json({ message: "Avatar file is required" });
    const avatar = await uploadOnCloudinary(avatarlocalpath);
    if (!avatar) return res.status(500).json({ mess: "failed to upload avatar on cloud" });

    const user = await User.create({ name, email, passwordHash: password, avatarUrl: avatar.url });
    const createduser = await User.findById(user._id).select("-passwordHash -refreshToken");
    return res.status(201).json({
        message: "user registered succesfully",
        data: createduser
    })
})

const login = asyncHandler(async (req, res) => {
    const { password, email } = req.body;

    if (!password || !email) return res.status(400).json({ message: "email and password must be required!" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "user not found" });

    const val = await user.comparePassword(password);
    if (!val) return res.status(401).json({ success: false, message: "password incorrect" });

    const { accesstoken, refreshtoken } = await generateAccessTokenAndRefreshToken(user._id);
    const loggedinuser = await User.findById(user._id).select("-passwordHash -refreshtoken")
    return res
        .status(200)
        .cookie("accesstoken", accesstoken, options)
        .cookie("refreshtoken", refreshtoken, options)
        .json({
            success: true,
            message: "user login succesfully",
            data: loggedinuser,
            accesstoken,
        });
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    
    const Incomingrefreshtoken = req.cookies.refreshtoken || req.body.refreshtoken;
    if (!Incomingrefreshtoken) return res.status(401).json({ message: "refreshtoken not found" })

    try {
        const decodedtoken = jwt.verify(
            Incomingrefreshtoken, process.env.REFRESH_TOKEN_SECRET
        )
        
        const user = await User.findById(decodedtoken._id);
        if (!user) return res.status(401).json({ message: "Invalid refresh token" })

        if (Incomingrefreshtoken !== user.refreshtoken) return res.status(401).json({ message: "refreshtoken is expired or used" });
        const { accesstoken, refreshtoken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accesstoken", accesstoken, options)
            .cookie("refreshtoken", newRefreshToken, options)
            .json({
                success: true,
                message: "Access token refreshed",
                accesstoken,
                refreshtoken: newRefreshToken
            });

    } catch (error) {
        return res.status(401).json({error:`${error.message}`, message: "Invalid refresh token" });
    }
})

const logout= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            "$unset":{
                refreshtoken:1
            }
        },
        {
            new:true
        }
    )
    return res
        .status(200)
        .clearCookie("accesstoken",options)
        .clearCookie("refreshtoken",options)
        .json({
            success:true,
            message:"user logout succesfully"
        })
})

const getMyProfile = async (req, res) => {
    const userkey = `user:${req.user._id}`;
    try {
        const cachedData = await redis.get(userkey);
        if (cachedData) {
            console.log("🔥 Redis Hit: Sending data from cache"); 
            return res.status(200).json({ 
                success: true, 
                user: JSON.parse(cachedData) 
            });
        }

        const user = await User.findById(req.user._id).select("-passwordHash").lean();
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await redis.setex(userkey, 86400, JSON.stringify(user));

        res.status(200).json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server Error" });
    }
};

export { register, login,logout,refreshAccessToken,getMyProfile };
