import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

//defining a method to generate tokens so that it can be used later during the login process
const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        //generateAccessToken and refresh token are methods and hence they end with ()
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //refresh tokens are saved in database unlike access tokens
        user.refreshToken = refreshToken 

        //validateBeforeSave is used to skip the presence of certain field set to "required:true" while defining the mongoose models
        await user.save({validateBeforeSave :false})

        return {accessToken,refreshToken}


    }catch(error){
        throw new Error("Something went wrong while generating refresh and access tokens")
    }

}


const registerUser = asyncHandler(async (req,res)=>{
    //get user details 

    const {username,email,password} = req.body;


    //validation - not empty

    if([username,email,password].some((field)=>
        field?.trim() ===""
    )) {
        throw new Error("All fields are required")
    }


    //check if the user already exists:username,email

    try {
        const userExists= await User.findOne(
            {
                $or:[{username},{email}]
            }
        )
        if(userExists){
            return res.status(400).json({
                success:false,
                error:"User with the same username or email already exists"
            })
        }
    } catch (error) {
        console.log(error,"An error occured while searching for already existing user in the database")
    }
    

    //check for images,avatar (req.files is a multer object)

    const avatarLocalPath  = req.files?.avatar[0]?.path;
    const coverImageLocalPath =  req.files?.coverImage[0]?.path;

 

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
            username,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            password,
            email,
            
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


const loginUser = asyncHandler(async (req,res)=>{
    //req data-- body
    //find user using email or username
    //password check
    //access the refresh token
    //send cookie

    const {email, username, password} = req.body
    console.log(req.body);


    if(!username&& !email){
        res.json({
            message:"Username or Email is required"
        })
    }

    const user =await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        res.jsos({
            message:"User doesn't exist"
        })
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        res.json({
            message:"Invalid password"
        })
    }

    const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        //these two settings make sure that the cookies are only modifiable through the backend
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json( new ApiResponse( //ApiResponse(statusCode,data,message)
        200,
        {
            loggedInUser:loggedInUser
        },
        "user logged in successfully"
    ))

})

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set: {refreshToken:undefined }
    })

    const options= {
        httpsOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

//refreshing the Access token using refresh token
const refreshAccessToken = asyncHandler(async(req,res,next)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiResponse(401,{incomingRefreshToken},"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        console.log(decodedToken)
    
        const user = User.findById(decodedToken?._id);
        if(!user){
            return res.status(401).json({
                message:"invalid refresh token"
            })
        }
    
        // if(decodedToken !== user?.refreshToken){
        //     return res.status(401).json({
        //         message:"Refresh token is expired or used"
        //     })
        // }
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,
                {accessToken:accessToken,refreshToken: newRefreshToken},
                {message:"Access token refreshed"}
                )
    
        )
    } catch (error) {
        res.json(
            {error}
        )
    }
    
})  


const changeCurrentPassword = asyncHandler(async(req,res,next)=>{
    const {oldPassword,newPassword}= req.body;

    //req.user already has the user stored in since the user is already logged in
    //req.user = user (auth.middleware.js)

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        res.status(400).json({
            message:"Invalid old password"
        })
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json({
        message:"Password changed successfully"
    })
})

const getCurrentUser = asyncHandler((async(req,res,next)=>{
    //user is already logged in and present in req.user
    return res.status(200).json({
        user:req.user,
        message:"Current user fetched successfully"
    })
}))

const updateUserAvatar = asyncHandler(async(req,res,next)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        res.status(400).json({
            message:"Avatar file is missing"
        })
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        res.status(400).json({
            message:"Error while uploading the avatar"
        })
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{avatar:avatar.url}
        },
        {new:true}  //stores the new updated value in user
        ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"AVatar updated successfully")
    )

})  

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        return res.status(400).json({
            message:"Username is missing"
        })
    }

    //using mongodb aggregation pipelines
    const channel = await  User.aggregate([
        {
            $match:{
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions" ,//collection
                //'Subscription' schema model is stored in database as 'subscriptions'
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
                //we calculate the number of channels in documents/database to lookup the number of subscribers a channel(user) has
            }
        },
        {
            $lookup:{
                from:"subscriptions" ,
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
                //we calculate the number of subscribers in documents/database to lookup the number of channels a user(channel) is subscribed to
            }
        },
        {
            $addFields:{
                subscriberCount : {
                    $size : "$subscribers" // '$' means that subscribers is a field
                },
                channelsSubscribedTo : {
                    $size: "$subscribedTo"
                },
                isSubscribed :{
                    $cond:{
                        if: {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
                
            }
        },
        {
            $project : { 
                //turn on flags of values to be shown/projected using 1
                username : 1,
                subscriberCount:1,
                channelsSubscribedTo:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1


            }
        }
    ])

    console.log(channel)
    if(!channel?.length){
        res.status(400).json({
            message:"Channel doesn't exist"
        })
    }
    return res.status(200)
    .json( new ApiResponse(200,channel[0],"User channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                //_id :req.user._id
                //we didn't use the line of code above cuz aggregation pipelines don't filter out the actual objectId out of '_id' unlike mongoose in which we can directly pass the 'req.user._id' argument

                _id:  new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                //subpipeline below
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0].getWatchHistory,"Watch history has been successfully fetched"))
})


export {registerUser, loginUser, logoutUser,refreshAccessToken,getCurrentUser,changeCurrentPassword,updateUserAvatar,getUserChannelProfile,getWatchHistory}
