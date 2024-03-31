import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        requied:true
    },
    views:{
        default:0,
        type:Number
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }


},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video  = mongoose.model("Video",videoSchema)