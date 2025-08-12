const mongoose=require("mongoose");
const{Schema}=mongoose;

const productSchema= new Schema({
    productName:{
        type:String,
        required:true
    },
    sku: {  
        type: String,
        unique: true,
        required: true
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
    
    price:{
        type:Number,
        default:0
    },
   productOffer: {
  value: { type: Number,
     default: 0 
    }, 
  type: { type: String,
     enum: ['percentage', 'flat'],
      default: 'flat' 
    }
},

    stock:{
        type:Number,
        default:0,
        min:0
    },
    color:{
        type:String,
        required:true
    },
    images:{
        type:[String],
        required:true
    },
    isNewArrival: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
    isBlocked:{
        type:Boolean,
        default:false
    },
     isDeleted: { type: Boolean, default: false },
    status:{
type:String,
enum:["In Stock","out of stock","Discontinued"],
required:true,
default:"In Stock"
    },
    createdAt: { type: Date, default: Date.now }
},{timestamps:true});
const Product=mongoose.model("Product",productSchema)
module.exports=Product;