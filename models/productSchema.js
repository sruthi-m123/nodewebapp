const mongoose=require("mongoose");
const{Schema}=mongoose;

const productSchema= new Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        default:0
    },
    productOffer:{
type:Number,
default:0
    },
    quantity:{
        type:Number,
        default:0
    },
    color:{
        type:String,
        required:true
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
type:String,
enum:["In Stock","out of stock","Discontinued"],
required:true,
default:"In Stock"
    }
},{timestamps:true});
const Product=mongoose.model("Product",productSchema)
module.exports=Product;