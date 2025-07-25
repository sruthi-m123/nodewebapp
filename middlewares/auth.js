const User = require("../models/userSchema");

const userAuth= (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data&&!data.isBlocked){
                next();
            }else{
                res.redirect("/login")
            }
        })
        .catch(error=>{
            console.log("Error in user auth middleware");
            res.status(500).send("Internal server error")
        })
    }else{
        res.redirect("/login")
    }
}

const adminAuth=(req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("Error in adminuth middleware",error);
        res.status(500).send("internal server error");
    })
}

const ifAuthenticated=(req,res,next)=>{
    if(req.session.user){
        return res.redirect('/');      
          

    }
    next();
}
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
    }
    next();
};
const isLoggedIn=(req,res,next)=>{
     // Check if session exists and has user data
    if (req.session && req.session.user && req.session.user._id) {
      return next();
    }
    // Redirect to login with message
    return res.redirect('/login?error=not_logged_in');
}
const isNotLoggedIn=(req,res,next)=>{
     if (!req.session || !req.session.user) {
      return next();
    }
    res.redirect('/');
  }

module.exports={
    userAuth,
    adminAuth,
    ifAuthenticated,
    redirectIfLoggedIn,
    isLoggedIn,
    isNotLoggedIn
}