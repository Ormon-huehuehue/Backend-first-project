import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,  //image URL
        required:true,
    },
    coverImage:{
        type:String, //image URL
        
    },
    watchHistory:[{     //array of videos
        type:Schema.Types.ObjectId,
        ref:"Video"
    }
    ],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})

//pre is a middleware
userSchema.pre("save",async function (next){  //dont use arrow functions in these middlewares
    //arrow functions don't have the 'this' reference

    if(!this.isModified("password")){ return next();} 
    this.password = await bcrypt.hash(this.password,10);
    next();
    
})


//schema.methods is used to define instance methods
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },

    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },

    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}



export const User = mongoose.model("User",userSchema);