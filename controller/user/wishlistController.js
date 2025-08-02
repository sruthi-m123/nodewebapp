const Cart=require('../../models/cartSchema');
const User=require('../../models/userSchema')
const Wishlist=require('../../models/wishlistSchema');
const Product=require('../../models/productSchema');

const getWishlistPage=async (req,res)=>{
  try {
const userId = req.session?.user?._id;
if (!userId) {
      return res.redirect('/login');
    }

    const wishlistItems=await Wishlist.find({userId}).populate({
        path:'product',
        select:'productName price images sku color',
        match:{isDeleted:false,isBlocked:false}
    });

    if (!wishlistItems || wishlistItems.length === 0) {
  return res.render('user/wishlist', {
    wishlistItems: [],
    user: req.user,
    itemCount: 0,
    message: 'No products available in your wishlist.'
  });
  
}


    const validItems=wishlistItems.filter(item=>item.product!==null);



const formattedItems=validItems.map(item=>({
    id:item._id,
    name:item.product.productName,
    price:item.product.price,
    // sku:item,product.sku,
    image:item.product.images[0],
    color:item.product.color
}))
res.render('user/wishlist',{
    wishlistItems:formattedItems,
    user:req.session.user,
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
        const{productId}=req.body;
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
    user:req.user._id,
    product:productId
})
     if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'Product already in wishlist'
      });
    }
     const newWishlistItem = new Wishlist({
      user: req.user._id,
      product: productId
    });

    await newWishlistItem.save();

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistCount: await Wishlist.countDocuments({ user: req.user._id })
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
        const {ItemId}=req.params;
        const item=await Wishlist.fincOneAndDelete({
            _id:ItemId,
            user:req.user._id
        });
        if(!item){
            return res.status(404).json({
                success:false,
                error:'item not found in your wishilst'
            })
        }

        res.json({
            succcess:true,
            error:'items removed from the wishlist',
            wishlistCount:await Wishlist.countDocuments({user:req.user._id})
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
            const wishlistItem=await Wishlist.findOne({
                _id:itemId,
                user:req.user._id
            }).populate('product');

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
if (cartItem) {
      cartItem.quantity += 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({
        user: req.user._id,
        product: wishlistItem.product._id,
        quantity: 1,
        price: wishlistItem.product.price
      });
      await cartItem.save();
    }
    //remove from the wishlist 
await Wishlist .findByIdAndDelete(itemId);

//get updated counts
const[wishlistCount,cartCount]=await Promise.all([
    Wishlist.countDocuments({user:req.user._id}),
    Cart.countDocuments({user:req.user._id})
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
      user: req.user._id,
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