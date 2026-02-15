import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import User from "../models/User.js";

export const verifyJWT= asyncHandler(async(req,_,next)=>{
    try{
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token) throw new Error("Unauthorized request");

        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const user=await User.findById(decodedToken._id);
        if(!user) throw new Error("Invalid Access Token");

        req.user=user;

        next();

    }catch(error){
        throw new Error(error?.message || "Invalid access token");
    }
})
