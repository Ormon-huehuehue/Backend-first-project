import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subcriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
})


export const Subcription = mongoose.model("Subscription",subscriptionSchema)