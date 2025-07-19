const mongoose=require("mongoose");
const {Schema}=mongoose;
const addressSchema= new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    address:[{
        addressType:{
            type:String,
            required:true,
             enum: ["Home", "Work", "Other"]
        },
        name:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        landmark:{
            type:String,
            
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        building:{
            type:String,
            required:true
        },
        phone:{
            type:String,
        required:true
        },
        altPhone:{
            type:String,
           
        },
         isDefault: { 
            type: Boolean, 
            default: false
         }
    }]
})
const Address= mongoose.model("Address",addressSchema);
module.exports=Address;