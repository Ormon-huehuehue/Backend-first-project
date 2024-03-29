import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subcribers:[{
        type:Schema.Types.objectId,
        ref:"User"
    }],
        
})


export const Subcription = mongoose.model("Subscription",subscriptionSchema)