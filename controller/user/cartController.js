const User= require("../../models/userSchema");
const Address=require("../../models/addressSchema");
const Cart=require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const getCart=async(req,res)=>{
try {
     if (!req.session.user) {
      return res.status(401).json({ message: 'Please login to continue shopping' });
    }
    const userId=req.session.user._id;
    const cartItems=await Cart.findOne({userId}).populate('items.productId');
console.log("cartItems:",cartItems)
    const total = cartItems?.items?.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0) || 0;
res.render('user/cart',{
cartItems: cartItems.items,
    total:total.toFixed(2),
    pageCSS:"user/cart.css",
    pageJS:"user/cart.js",
    pageTitle:"Cart"
});
} catch (error) {
    console.log(error)
    res.status(500).send('error loading cart');
}
}
const addToCart=async(req,res)=>{
    
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Please login to continue shopping' });
    }
    const userId=req.session.user._id;
    const productId=req.params.productId;
const quantity=parseInt(req.body.quantity);

const product=await Product.findById(productId);
if(!product){
    return res.status(404).json({message:"product not found "});
}
const price = product.price;
    const totalPrice = price * quantity;
    let cart=await Cart.findOne({userId});
    if(!cart){
       //first time cart creation
       cart=new Cart({
        userId,
        items:[{productId,quantity,price,totalPrice}]
       });
       
    }else{
        const existingItem=cart.items.find(item=>item.productId.toString()===productId)
    if(existingItem){
        existingItem.quantity+=quantity;
        existingItem.totalPrice += totalPrice;
    }else{
        cart.items.push({productId,quantity,price,totalPrice});
    }
    }
    await cart.save();
    res.status(200).json({success:true,message:'Product added to cart successfully'})
} catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send("Internal Server Error");
  }
}
const removeCartItem=async(req,res)=>{
    const userId=req.session.user?._id;
    const itemId=req.params.itemId;
    if(!userId){
        return res.status(401).json({message:'please login to continue'});
    }
    try {
        const cart=await Cart.findOne({userId});
        if(!cart){
            return res.status(404).json({message:'cart not found'});
        }

cart.items=cart.items.filter(item=>item._id.toString()!==itemId);
await cart.save();
return res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing item from cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
    }
}




module.exports={
    getCart,
    addToCart,
    removeCartItem
   }