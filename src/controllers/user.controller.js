import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/apiResponse.js";


const registerUser = asyncHandler(async (req,res)=>{
    //get user details 

    const {fullName,username,email,password} = req.body;


    //validation - not empty

    if([fullName,username,email,password].some((field)=>
        field?.trim() ===""
    )) {
        throw new Error("All fields are required")
    }


    //check if the user already exists:username,email

    const userExists= await User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    if(userExists){
        throw new Error("User with the same username or email already exists")
    }
    

    //check for images,avatar (req.files is a multer object)

    const avatarLocalPath  =await req.files?.avatar[0]?.path;
    const coverImageLocalPath = await req.files?.coverImage[0]?.path;

 

    if(!avatarLocalPath){
        throw new Error("Avatar file is required")
    }

    //upload them to cloudinary, check upload status

     const avatar = await uploadOnCloudinary(avatarLocalPath);
     const coverImage = await uploadOnCloudinary(coverImageLocalPath);

     if(!avatar){
        throw new Error("Avatar file is required")
     }


    // create user object - create entry in database\

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        email,
        username: username.toLowerCase()
    })

    console.log("user created")
    
    
    //remove password and refresh token field from response

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check for user creation

    if(!createdUser){
        throw new Error("User not created")
    }


    //return response
        //api response(statusCode,data,message)
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )



})

export {registerUser}