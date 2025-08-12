const Cart=require('../../models/cartSchema');
const User=require('../../models/userSchema')
const Wishlist=require('../../models/wishlistSchema');
const Product=require('../../models/productSchema');

const getWishlistPage=async (req,res)=>{
  try {
    console.log("hit the wishcontroller")
    console.log("this is user in wishlistL",req.session.user);

    if(!req.session.user){
  return res.redirect('/login');
}

 
const userId = req.session?.user?.id;
const userData=await User.findById(userId);


    const wishlistItems=await Wishlist.find({user:userId}).populate({
        path:'product',
        select:'productName price images sku color',
        match:{isDeleted:false,isBlocked:false}
    });
console.log("wishlist items:",wishlistItems);
    const validItems=wishlistItems.filter(item=>item.product!==null);

const formattedItems=validItems.map(item=>({
    id:item._id,
    name:item.product.productName,
    price:item.product.price,
    image:item.product.images[0],
    color:item.product.color
}))
console.log("formatted items:",formattedItems);
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
      console.log("inside the add to wishlist")
      if (!req.session.user) {
      return res.status(401).json({
        success: false,
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
        if(!product){
return res.status(404).json({
    succcess:false,
    error:'product not available'
});
        }
const existingItem=await Wishlist.findOne({
    user:userId,
    product:productId
})
     if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'Product already in wishlist'
      });
    }
     const newWishlistItem = new Wishlist({
      user: userId,
      product: productId
    });

    await newWishlistItem.save();

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistCount: await Wishlist.countDocuments({ user:userId })
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
        
          const userId=req.session.user?.id;
          if (!itemId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
        
        const item=await Wishlist.findOneAndDelete({
            _id:itemId,
            user:userId
        });
        if(!item){
            return res.status(404).json({
                success:false,
                error:'item not found in your wishilst'
            })
        }

        res.json({
            success:true,
            message:'items removed from the wishlist',
            wishlistCount:await Wishlist.countDocuments({user:userId})
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
            const{itemId}=req.params;
            console.log("itemId",itemId);
const userId=req.session.user?.id;
            console.log("userId inside the wishlis add to cart",userId);
            const wishlistItem=await Wishlist.findOne({
                _id:itemId,
                user:userId
            }).populate('product');
            console.log("wishlist items :",wishlistItem);

if(!wishlistItem||!wishlistItem.product){
    return res.status(404).json({
        success:false,
        error:'Item not found or product unavailable '
    })
}
//check product availablity again
 if (wishlistItem.product.isDeleted || 
        wishlistItem.product.isBlocked || 
        wishlistItem.product.status !== 'In Stock') {
      await Wishlist.findByIdAndDelete(itemId);
      return res.status(400).json({
        success: false,
        error: 'Product no longer available'
      });
        }

        let cart=await Cart.findOne({userId:userId});
        const totalPrice=wishlistItem.product.price*1;
if (cart) {
      const existingItem=cart.items.find(item=>
        item.productId.equals(wishlistItem.product._id)
      );

      if(existingItem){
        existingItem.quantity+=1;
      
    } else {
     cart.items.push({
      productId:wishlistItem.product._id,
      quantity:1,
      price:wishlistItem.product.price,
      totalPrice:wishlistItem.product.price,
     })
      await cart.save();
    }
  }else{
      cart=new Cart({
        userId,
        items:[
          {
            productId:wishlistItem.product._id,
            quantity:1,
            price:wishlistItem.product.price,
            totalPrice:wishlistItem.product.price
          }
        ]
      })
      await cart.save();
    }
    //remove from the wishlist 
await Wishlist .findByIdAndDelete(itemId);

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
      product: productId
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