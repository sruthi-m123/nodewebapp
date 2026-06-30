import contactUsService from "../../service/user/contactUs.service.js"
import { STATUS_CODES } from "../../utils/statusCodes.js"
export const getContactUsPage=async(req,res)=>{
return res.render('user/contactUs',{
    pageCSS: "user/contactUs.css",
    pageJS:"user/contact.js",
    pageTitle:"Contact Us" 
})
}

export const sendMessage= async (req,res,next)=>{
    try {
        const {name,email,message}=req.body;
        if(!name||!email||!message){
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success:false,
                message:"All fields are required"
            });
        }
        const response=await contactUsService.sendContactMail(name,email,message);
        return res.status(STATUS_CODES.SUCCESS).json(response);
    } catch (error) {
        console.log(error);
        next(error);
    }
}