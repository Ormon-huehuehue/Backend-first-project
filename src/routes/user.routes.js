import { Router } from "express";
import {registerUser, loginUser, logoutUser,refreshAccessToken,getCurrentUser,changeCurrentPassword,updateUserAvatar,getUserChannelProfile} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post( //upload is a middleware from multer
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);


router.route("/login").post(loginUser)


//secured routes

router.route("/logout").post(verifyJWT,logoutUser)


router.route("/refreshToken").post(refreshAccessToken)

router.route("/changeCurrentPassword").post(verifyJWT,changeCurrentPassword)

router.route("/getCurrentUser").post(getCurrentUser)

router.route("/getUserChannelProfile").post(updateUserAvatar)


export default router;
//router can be renamed while importing if export default is used

//we imported router as "userRouter" in app.js file