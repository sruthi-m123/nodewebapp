import User from "../models/userSchema.js"

export const userAuth= (req,res,next)=>{

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
            console.log("Error in user auth middleware",error);
            res.status(500).send("Internal server error")
        })
    }else{
        res.redirect("/login")
    }
}

 export const adminAuth=(req,res,next)=>{
    
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data&&req.session.admin){
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

 export const ifAuthenticated=(req,res,next)=>{
    if(req.session.user){
        return res.redirect('/');      
          

    }
    next();
}
export const isLoggedIn=(req,res,next)=>{
    console.log("user in isLogged middleware",req.session)
    if (req.session && req.session.user && req.session.user.id) {
      return next();
    }
    return res.redirect('/user/login?error=not_logged_in');
}
export const isNotLoggedIn = (req, res, next) => {
     if (!req.session || !req.session.user) {
      return next();
    }
    res.redirect('/user/home');
  }

export const checkBlocked = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next();
  }
  try {
    const user = await User.findById(req.session.user.id);
    if (user && user.isBlocked) {
      req.session.destroy(() => {});
      return res.redirect('/user/login?error=account_blocked');
    }
    next();
  } catch (error) {
    console.error('checkBlocked middleware error:', error);
    next();
  }
}
