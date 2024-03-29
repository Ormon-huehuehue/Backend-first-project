import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT  =  asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.headers("Authorization").replace("Bearer ","")
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        
        //authenticated user object
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            throw new Error("Invalid access token")
        }
        //we're adding a new property named 'user' to the 'req' object for later use within route handlers and middlewares to access the authenticated user object
        req.user = user;
    
        next();
    } catch (error) {
        throw new Error("something went wrong during the verification process")
    }
})