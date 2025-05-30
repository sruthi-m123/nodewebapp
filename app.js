const express=require("express");
const app=express()//server instance created
const env =require("dotenv").config();

const db=require("./config/db");
db()


app.listen(process.env.PORT,()=>{
    console.log("server Running");
})
module.exports=app;