import User from '../models/userSchema.js';

 export const checkBlocked=async function(req,res,next){
    try {
        if(req.session.user){
            const user=await User.findById(req.session.user.id);

            if(user&&user.isBlocked){
                req.session.destroy((err)=>{
                    if(err)console.log('error destroying blocked user session',err);
                    res.clearCookie('connect.sid');
                    return res.redirect('/user/login?message=You are blocked by admin');
                });
                return;
            }
        }
        next();
    } catch (error) {
        console.error('error in checkblocked middleware:',error);
        res.redirect('/user/error');
    }
}


