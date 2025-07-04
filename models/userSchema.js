
const mongoose=require("mongoose");
const {Schema}=mongoose;

const userSchema=new Schema({
    name:{
        type:String,
        required:true
    },


    email :{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
      
    },
    gender:{
        type:String,
       enum:['Male','Female','Other','Prefer not to say'],
    },
    avatar:{
        type:String,
        default:'/img/profile.jpg'
    },
googleId:{
    type:String,
    unique:true,
        sparse:true,
    required:false
    },
    lastUpdated:{
        type:Date
        },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:{
       type:Schema.Types.ObjectId, 
       ref:"Cart"
    },
    wallet:{
        type:Number,
        default:0
    },
    wishlist:[{
type:Schema.Types.ObjectId,
ref:"Wishlist"
    }],
orderHistory:[{
    type:Schema.Types.ObjectId,
    ref:"Order"
}],
createdOn:{
    type:Date,
    default:Date.now,
},
referalCode:{
    type:String
},
redeemed:{
    type:Boolean
},
redeemedUsers:[{
    type:Schema.Types.ObjectId,
    ref:"User"
}],
searchHistory:[{
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category"
    },
    searchOn:{
                type:Date,
        default:Date.now
    }
}]

})

userSchema.pre('save',function(next){
    if(this.isModified('name')){
        const nameParts=this.name.split(' ');
        this.firstName=nameParts[0]||'';
        this.lastName=nameParts.slice(1).join(' ')||'';

    }
    next();
})

const User=mongoose.model("User",userSchema);
module.exports= User;
