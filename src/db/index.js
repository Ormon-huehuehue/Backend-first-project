
import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async()=>{
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MONGODB connected !! \nDB HOST : ${connectionInstance.connection.host}`)
    } catch(error){
        console.log("mongoDB connection failed",error);
        process.exit(1);
    }
}
export default connectDB;
