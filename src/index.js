import express from "express";
import connectDB from "./db/index.js";
const app = express();
//require("dotenv").config({path: './.env'});

import dotenv from "dotenv";
dotenv.config({path: './env'});


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App is listening on port ${process.env.PORT || 8000}`)
    
    })
})
.catch((error)=>{
    console.log("error connecting to mongoDB",error);
})


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

