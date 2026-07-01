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
    if (req.session && req.session.user && req.session.user.id) {
      return next();
    }
    // Check if AJAX/API request
    if (req.xhr || 
        (req.headers.accept && req.headers.accept.includes('json')) || 
        (req.headers['content-type'] && req.headers['content-type'].includes('json')) ||
        req.path.startsWith('/wishlist/') || 
        req.path.startsWith('/cart/')) {
      return res.status(401).json({ success: false, message: "Please login to continue" });
    }
    return res.redirect('/user/login')
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
    //   return res.redirect('/user/login?error=account_blocked');
    return res.redirect('/user/login?message="account blocked');
    }
    next();
  } catch (error) {
    console.error('checkBlocked middleware error:', error);
    next();
  }
}
