const Cart=require('../../models/cartSchema');
const User=require('../../models/userSchema')
const Wishlist=require('../../models/wishlistSchema');
const Product=require('../../models/productSchema');

const getWishlistPage=async (req,res)=>{
  try {
    console.log("hit the wishcontroller")

    if(!req.session.user){
  return res.redirect('/login');
}

 
const userId = req.session?.user?.id;
const userData=await User.findById(userId);


    const wishlistItems=await Wishlist.findOne({user:userId}).populate({
        path:'items.productId',
        match:{isDeleted:false,isBlocked:false}
    });
    console.log("wishlist items:",wishlistItems);
    let validItems=[];
    if(wishlistItems&&wishlistItems.items){
     validItems=wishlistItems.items.filter(i=>i.productId!==null);

    }
console.log("valid items:",validItems );
const formattedItems = validItems.map(item => ({
 
    id: item._id,
    name: item.productId.productName,
    discountedPrice:item.productId.discountedPrice,
    price: item.productId.discountedPrice > 0 
           ? item.productId.discountedPrice 
           : item.productId.price,
    originalPrice: item.productId.price,  
    image: item.productId.images[0],
    color: item.productId.color
}));

// console.log("formatted items:",formattedItems);
res.render('user/wishlist',{
  pageCSS:"user/wishlist.css",
  pageJS:"user/wishlist.js",
    wishlistItems:formattedItems,
    user:userData,
    itemCount:formattedItems.length,
     message: formattedItems.length === 0 ? 'No valid products in your wishlist.' : null
});

} catch (error) {
    console.error('error fetching the wishlist items :',error);
    res.status(500).send('server error ');
}
}
const addToWishlist=async(req,res)=>{
    try {
      if (!req.session.user) {
      return res.status(401).json({
        error: false,
        message: "Please login to add to wishlist",
      });
    }
    const userId=req.session.user?.id;
        const{productId}=req.params;
       
        console.log("params productId:",productId);
        const product=await Product.findOne({
            _id:productId,
            isDeleted:false,
            isBlocked:false,
            status:'In Stock'
        });
        console.log("product:",product);
        if(!product){
return res.status(404).json({
    succcess:false,
    error:'product not available'
});
        }


let wishlist=await Wishlist.findOne({user:userId});

if(!wishlist){
  wishlist=new Wishlist({
    user:userId,
    items:[{productId}]
  })
}else{
    const existingItem = wishlist.items.find(
        (item) => item.productId.toString() === productId.toString()
      );
     if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'Product already in wishlist'
      });
    }
    wishlist.items.push({productId});
  }
    

    await wishlist.save();

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistCount: wishlist.items.length
    });
    

}catch (error) {
         console.error('Add to Wishlist Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  
    }
}

const removeFromWishlist=async(req,res)=>{
    try {
        const {itemId}=req.params;
        console.log("items in removal of productId:",itemId)
        
          const userId=req.session.user?.id;
          if (!itemId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
        
        const updatedWishlist=await Wishlist.findOneAndUpdate(
          {user:userId},
          {$pull:{items:{_id:itemId}}},
          {new:true}
        );
        console.log("updated wishlist after the removal",updatedWishlist);
        if(!updatedWishlist){
            return res.status(404).json({
                success:false,
                error:'item not found in your wishilst'
            })
        }

        res.json({
            success:true,
            message:'items removed from the wishlist',
            wishlistCount:updatedWishlist.items.length
        })
    } catch (error) {
          console.error('Remove from Wishlist Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
    }
    //add to cart from the wishlist 

    const addToCartFromWishlist=async(req,res)=>{
        try {
          console.log("inside add to cart wishlist controlller");
            const{itemId}=req.params;
            console.log("itemId",itemId);
const userId=req.session.user?.id;
            console.log("userId inside the wishlist add to cart",userId);
            const wishlist=await Wishlist.findOne({
                
                user:userId
            }).populate('items.productId');
            console.log("wishlist items :",wishlist);
            const wishlistItem=wishlist.items.find(i=>i._id.toString()===itemId);

if(!wishlist||wishlist.items.length==0){
    return res.status(404).json({
        success:false,
        error:'Item not found or product unavailable '
    })
}
//check product availablity again
 if (wishlistItem.productId.isDeleted || 
        wishlistItem.productId.isActive=='false' 
      ) {
      await Wishlist.findOneAndUpdate({user:userId},
        {$pull:{items:{_id:item._id}}}
      );
      return res.status(400).json({
        success: false,
        error: 'Product no longer available'
      });
        }

        let cart=await Cart.findOne({userId:userId});
        console.log("cart inside the wishlistcontroller in add to cart:",cart);
        const price=wishlistItem.productId.discountedPrice||wishlistItem.productId.price;
        const totalPrice=price*1;
if (cart) {
      const existingItem=cart.items.find(item=>
        item.productId.equals(wishlistItem.productId._id)
      );
console.log("existing item in cart fromm wishlist controller :",existingItem);
      if(existingItem){
        if(existingItem.quantity+1>wishlistItem.productId.stock){
          return res.status(400).json({
            success:false,
            error:'Not enough stock available'
          });
        }
        existingItem.quantity+=1;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
      
      await cart.save();
    } else {
      console.log("helooooo")
if(wishlistItem.productId.stock<=0){
  return res.status(400).json({
    success:false,
    error:'Product is out of stock'
  });
}

     cart.items.push({
      productId:wishlistItem.productId._id,
      quantity:1,
      price:wishlistItem.productId.price,
      totalPrice:totalPrice,
     })
      await cart.save();
    }
    console.log("newly created cart:",cart);
  }else{
     if (wishlistItem.productId.stock <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Product is out of stock'
    });
  }
      cart=new Cart({
        userId,
        items:[
          {
            productId:wishlistItem.productId._id,
            quantity:1,
            price:wishlistItem.productId.discountedPrice??wishlistItem.productId.price,
            totalPrice:totalPrice
          }
        ]
      })
      console.log("befor saving to the cart ",cart);
      await cart.save();
    }
    //remove from the wishlist 
// await Wishlist .findByIdAndDelete(itemId);
await Wishlist.findOneAndUpdate(
  { user: userId }, 
  { $pull: { items: { _id: itemId } } }, 
  { new: true } 
);

//get updated counts
const[wishlistCount,cartCount]=await Promise.all([
    Wishlist.countDocuments({user:userId}),
    Cart.countDocuments({user:userId})
]);
res.json({
    success:true,
    message:'product added to cart',
    wishlistCount,
    cartCount
})

        } catch (error) {
             console.error('Wishlist to Cart Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
        }
    
const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await Wishlist.findOne({
      user: req.user.id,
      product: items.productId
    });

    res.json({
      inWishlist: !!item
    });

  } catch (error) {
    console.error('Wishlist Check Error:', error);
    res.status(500).json({
      error: 'Server Error'
    });
  }
}
module.exports={
    checkWishlistStatus,addToCartFromWishlist,
    getWishlistPage,
    removeFromWishlist,
    addToWishlist

}