const User= require("../../models/userSchema");
const Address=require("../../models/addressSchema");
const Cart=require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const getCart=async(req,res)=>{
try {
     if (!req.session.user) {
      return res.status(401).json({ message: 'Please login to continue shopping' });
    }
    console.log(req.session.user);
    const userId=req.session.user._id;
    let cartItems=await Cart.findOne({userId}).populate('items.productId');
    if (!cartItems) {
     cartItems = { items: [], totalPrice: 0 };
    }
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
const addToCart = async (req, res) => {
  try {
    
    if (!req.session.user) {
      return res.status(401).json({ message: 'Please login to continue shopping' });
    }

    const userId = req.session.user._id;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);
const limit=10;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const price = product.price;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      if (quantity > product.stock) {
        return res.json({
          status: 'error',
          message: `Only ${product.stock} left in stock. Cannot add ${quantity} to cart.`
        });
      }
      
if(quantity>=limit){
   return res.json({
          status: 'error',
          message: ` you can only add limited ${limit} products`
        });
}


      const totalPrice = price * quantity;
      cart = new Cart({
        userId,
        items: [{ productId, quantity, price, totalPrice }]
      });

    } else {
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      const existingQty = existingItem ? existingItem.quantity : 0;
      const newQuantity = existingQty + quantity;

      if (newQuantity > product.stock) {
        return res.json({
          status: 'error',
          message: `You already have ${existingQty} of this item in your cart. Cannot add more than ${product.stock} total due to stock limit.`
        });
      }

      
if(quantity>=limit){
   return res.json({
          status: 'error',
          message: ` you can only add limited ${limit} products`
        });
}

      if (existingItem) {
        existingItem.quantity = newQuantity;
        existingItem.totalPrice = newQuantity * price;
      } else {
        const totalPrice = price * quantity;
        cart.items.push({ productId, quantity, price, totalPrice });
      }
    }

    await cart.save();
    return res.status(200).json({ success: true, message: 'Product added to cart successfully' });

  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


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

//quantity update in cart
const updateCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const updates = req.body.updates;

    console.log(" Updates received:", updates);

    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({ message: "Cart is empty or not found", cart: [] });
    }

    for (const update of updates) {
      const item = cart.items.find((i) => i._id.toString() === update.id);

      if (item) {
        item.quantity = update.quantity;
        item.totalPrice = item.quantity * item.price;
      }
    }

    await cart.save();

    console.log(" Cart updated successfully:", cart);

    res.status(200).json({ message: "Cart updated successfully", cart });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports={
    getCart,
    addToCart,
    removeCartItem,
    updateCart
   }