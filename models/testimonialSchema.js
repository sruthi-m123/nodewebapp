const mongoose=require("mongoose");
const testimonialSchema=new mongoose.Schema({
    customerName:{type:String,requires:true},
    title:{type:String,required:true},
    img:{type:String,required:true},
    isVisible:{type:String,default:true},
    createdAt:{type:Date,default:Date.now}
});
const Testimonial=mongoose.model("Testimonial",testimonialSchema);
module.exports=Testimonial;