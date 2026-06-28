const express=require("express");
const cors=require("cors");
const cookieParser=require("cookie-parser");
const app=express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.get("/", (req,res)=>{
    res.json({
        "message": "Welcome to the Chat APP Api"
    });
});
app.get("/about",(req,res)=>{
    res.json({
        "project": "real time chat application",
        "intern":"Abdul Rehman" 
    });
})
module.exports=app;