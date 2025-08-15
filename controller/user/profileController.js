const path = require("path");
const bcrypt = require('bcrypt');
const fs = require("fs");
const User = require("../../models/userSchema");
const { sendEmailChangeOTP } = require('../../services/emailService');

class profileController {
  static async getProfile(req, res) {
    try {
      const userId = req.session?.user?._id || req.user?._id;
      if (!userId) return res.redirect("/login?error=session_lost");

      const user = await User.findById(userId).select("-password -googleId -isBlocked -isAdmin");
console.log("user avatar",user.avatar)
      res.render("/user/profile", {
        activeTab: "profile",
        user: {
name: user.name || "",
          email: user.email,
          phone: user.phone,
          gender: user.gender || "Prefer not say",
          avatar: user.avatar|| "/img/admin-products.png",
        },
      });
    } catch (error) {
      console.error("Profile load error:", error);
      res.redirect("/error");
    }
  }

  
    static async getEditProfile(req, res) {
    try {
      console.log("req sesison isde the edit profile:",req.session);
      const userId = req.session?.user?._id ;
      
      if (!userId) return res.redirect("/login?error=session_lost");

      const user = await User.findById(userId);
      if (!user) return res.redirect("/login?error=user_not_found");

      res.render("user/editProfile", {
        activeTab: "profile",
        user: {
          name: user.name || "",
          email: user.email,
          phone: user.phone || "",
          gender: user.gender || "Prefer not say",
          avatar: user.avatar || "/img/admin-products.png", 
          googleId:user.googleId
        }
      });
    } catch (error) {
      console.error("Edit profile page load error:", error);
      res.redirect("/error");
    }
  }



static async updateProfile(req,res){
  try {
    const{name,phone,gender}=req.body;
    const updates={name,phone,gender};

    if(req.file){
      if(req.user.avatar&& !req.user.avatar.include('admin-products.png')){
        const oldAvatarPath=path.join(__dirname,'../public',req.user.avatar);
        if(fs.existsSync(oldAvatarPath)){
          fs.unlinkSync(oldAvatarPath);
        }
      }
      updates.avatar='/uploads/'+req.file.filename;

    }
const user=await User.findByIdAndUpdate(
  req.session.user._id,
  updates,
  {new:true,runValidtors:true}

).select('-password');
res.json({
  success:true,
  message:'profile updated successfully',
  upadatedAvatarUrl:user.avatar
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
}

static async requestEmailChangeOTP(req,res){
try {
  const{newEmail}=req.body;

  //checking the existing email
  const existingUser=await User.findOne({email:newEmail});
  if(existingUser){
    return res.status(400).json({
      success:false,
      message:'email is already in use '
    })
  }
const otp=Math.floor(100000+Math.random()*900000);//otp generates
  console.log("otp:",otp);
// send otp to new email
   await sendEmailChangeOTP(newEmail,otp);
// store in session
req.session.emailChangeOTP=otp;
req.session.emailChangeTarget=newEmail;



res.status(200).json({
  success:true,
  message:'OTP sent to your new email'
});

} catch (error) {
   console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending OTP'
    });
  }

}

static async verifyEmailChange(req,res){
const{ enteredOtp}=req.body;
console.log("enetered otp:",enteredOtp);
if(parseInt(enteredOtp)===req.session.emailChangeOTP){
  const newEmail=req.session.emailChangeTarget;

//update user in DB
await User.findByIdAndUpdate(req.session.user._id,{email:newEmail});
//clear session
delete req.session.emailChangeOTP;
delete req.session.emailChangeTarget;

return res.status(200).json({success:true,message:'email updated successfully'})
}else{
  return res.status(400).json({success:false,message:'Inavalid Otp'})
}
}

static async changePassword(req,res){
  try {
    console.log("inside change password controller ")
    const userId=req.session?.user?._id;
    console.log("userId:",userId);
    const{currentPassword,newPassword}=req.body;
    console.log(currentPassword,newPassword);
    if(!userId){
      return res.status(401).json({message:'unauthorized request.'});

    }

    if(!currentPassword||!newPassword){
      return res.status(400).json({message:'all field are required.'})
    }

const user=await User.findById(userId);
console.log("user found")
if(!user){
  return res.status(404).json({message:'user not found.'})
}
const isMatch=await bcrypt.compare(currentPassword,user.password);

if(!isMatch){
  return res.status(400).json({message:'current password is incorrect.'})
}
const hashedPassword=await bcrypt.hash(newPassword,10);
user.password=hashedPassword;

await user.save();
return res.status(200).json({message:'password changed successfully.'})
  } catch (error) {
    console.error('password change error:',error);
    return res.status(500).json({message:'server error.Please try again'})
  }
}












}

module.exports = profileController;
