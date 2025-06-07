const express=require("express");
const app=express()
const path =require("path");

const db=require("./config/db");
const userRouter=require("./routes/userRouter");
const session=require("express-session");
db()

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use((req,res,next)=>{
    res.locals.currentPath=req.path;
    next();
});
app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next();
})

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
saveUninitialized:true,
cookie:{
    secure:false,
    httpOnly:true,
    maxAge:72*60*60*1000
}
}))


app.set("view engine","ejs");
// app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin'),path.join(__dirname,"views/partials")])
app.set("views",path.join(__dirname,"views"))
app.use(express.static(path.join(__dirname,"public")));

app.use("/",userRouter);
 app.use('/user',userRouter);

 app.get("/error", (req, res) => {
  res.status(500).render("user/error",{message:"something went wrong!"});
 });

app.use((req, res) => {
  res.status(404).render("user/pageNotFound");
});

app.listen(process.env.PORT,()=>{
    console.log("server Running");
})
module.exports=app;