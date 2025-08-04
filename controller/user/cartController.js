const User= require("../../models/userSchema");
const Address=require("../../models/addressSchema");
const Cart=require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const getCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Please login to continue shopping' });
    }

    const userId = req.session.user._id;
    let cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart) {
      cart = { items: [], totalPrice: 0 };
    }

    const outOfStockItems = [];
    const validItems = [];

    // Single loop through all items
    for (const item of cart.items) {
      const product = item.productId;
      
      // Case 1: Product deleted or completely out of stock
      if (!product || product.stock < 1) {
        outOfStockItems.push({
          productId: item.productId?._id,
          name: product?.name || 'Deleted Product',
          available: 0,
          requested: item.quantity
        });
        continue;
      }

      // Case 2: Partial stock available
      const allowedQty = Math.min(item.quantity, product.stock);
      if (allowedQty < item.quantity) {
        outOfStockItems.push({
          productId: product._id,
          name: product.productName,
          available: product.stock,
          requested: item.quantity
        });
      }

      validItems.push({
        _id:item._id,
        quantity: allowedQty,
        productId: product,
        price:item.price 
      });
    }

    // Update cart if changes needed
    if (outOfStockItems.length > 0) {
      await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: validItems } }
      );
      req.session.outOfStockItems = outOfStockItems;
    }

    // Handle checkout redirect case
    if (req.query.error === 'Some items are out of stock' && req.session.outOfStockItems) {
      return res.render('user/cart', {
        cartItems: validItems,
        total: validItems.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0).toFixed(2),
        pageCSS: "user/cart.css",
        pageJS: "user/cart.js",
        pageTitle: "Cart",
        error: 'Some items were adjusted due to stock limitations',
        outOfStockItems: req.session.outOfStockItems,
        showStockAlert: true
      });
    }

    // Normal render
    const total = validItems.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);

    res.render('user/cart', {
      cartItems: validItems,
      total: total.toFixed(2),
      pageCSS: "user/cart.css",
      pageJS: "user/cart.js",
      pageTitle: "Cart",
      error: req.query.error || null,
      outOfStockItems: req.session.outOfStockItems || null,
      showStockAlert: outOfStockItems.length > 0
    });

    // Cleanup session
    if (req.session.outOfStockItems) {
      delete req.session.outOfStockItems;
    }

  } catch (error) {
    console.error('Cart error:', error);
    res.status(500).send('Error loading cart');
  }
};
const addToCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Please login to continue shopping' });
    }

    const userId = req.session.user._id;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);
    const limit = 10;

    // Atomic stock check and reservation
    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: quantity } // Only match if sufficient stock
      },
      { $inc: { stock: -quantity } },
      { new: true }
    );

    if (!product) {
      const currentProduct = await Product.findById(productId);
      const available = currentProduct?.stock || 0;
      return res.status(400).json({
        status: 'error',
        message: available > 0 
          ? `Only ${available} units available` 
          : 'Product out of stock'
      });
    }

    // Quantity limit check
    if (quantity > limit) {
      // Rollback stock deduction
      await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
      return res.status(400).json({
        status: 'error',
        message: `Maximum ${limit} items per order`
      });
    }

    // Cart update logic
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({
        userId,
        items: [{
          
          productId,
          quantity,
          price: product.price,
          totalPrice: product.price * quantity
        }]
      });
    } else {
      const existingItem = cart.items.find(item => 
        item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * product.price;
      } else {
        cart.items.push({
          
          productId,
          quantity,
          price: product.price,
          totalPrice: product.price * quantity
        });
      }
    }

    await cart.save();
    res.json({ 
      success: true,
      message: 'Added to cart',
      stock: product.stock,
      cartCount:cartCount
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error'
    });
  }
};

const removeCartItem=async(req,res)=>{
  if (!req.session.user && !req.user) {
  return res.status(401).json({ message: 'please login to continue' });
}

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

cart.items=cart.items.filter(item=>item._id.toString()!==itemId)
.map(item=>({
  ...item.toObject(),
  totalPrice:item.price*item.quantity
}))
await cart.save();
return res.status(200).json({ message: 'Item removed from cart' ,cartCount:cartCount});
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
        const product=await Product.findById(item.productId);
        if(update.quantity>product.stock){
          return res.status(400).json({
            message:`cannot update quantity:Only ${product.stock}
            units available for ${product.name}`,
            productId:item.productId
          })
        }
       
      }
    }

for(const update of updates){
  const item=cart.items.find((i)=>i._id.toString()===update.id);

if(item){
  item.quantity=update.quantity;
item.totalPrice=item.quantity*item.price;
}
}



    await cart.save();

    console.log(" Cart updated successfully:", cart);

    res.status(200).json({ message: "Cart updated successfully", cart,cartCount:cartCount });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCartCount=async(userId)=>{
  const cart=await Cart.findOne({userId});
  return cart?cart.items.length:0;
};
const cartCount=async(req,res)=>{
  if(!req.session.user) return res.json({cartCount:0});

  try {
    const count=await getCartCount(req.session.user._id);
    res.json({cartCount:count});
  } catch (error) {
    console.error("cart count fetch error:",error);
  }
}


module.exports={
    getCart,
    addToCart,
    removeCartItem,
    updateCart,
    cartCount,
    getCartCount,
    cartCount
   }