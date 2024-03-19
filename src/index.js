import express from "express";
import connectDB from "./db/index.js";
const app = express();
//require("dotenv").config({path: './.env'});

import dotenv from "dotenv";
dotenv.config({path: './env'});


connectDB();


/*
async function CONNECT_DB(){
    try{
        await mongoose.connect(`${PROCESS.ENV.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error connecting to the database");
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.error("Error",erorr);
        throw error
    }

}
*/

