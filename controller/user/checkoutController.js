// controllers/checkoutController.js
const mongoose = require("mongoose");
const User=require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Offer = require('../../models/offerSchema');
const Coupon=require('../../models/couponSchema');
const{calculateOrder}=require('../../helper/calculateTotal');
const{validateAddress}=require('../../helper/validation')
      const Razorpay = require('razorpay');

const razorpayController=require('../../controller/user/razorpayController');
const addressController=require('../../controller/user/addressController');


exports.getCheckoutPage = async (req, res) => {
    try {
        console.log("inside checkout controller");
        if(!req.session.user){
            return res.status(401).json({ error: "Please log in to proceed to checkout" });
        }
        const userId = req.session.user.id;

        const userData= await User.findById(userId);
        

let addressesDoc = await Address.findOne({ userId }).lean();

let addresses = [];
if (addressesDoc && addressesDoc.address) {
  addresses = addressesDoc.address.filter(addr => !addr.isDeleted);
}

        let cartItems = [];
        let fromCart = true;
        let stockValidationFailed=false;
        let outOfStockItems=[];

        if (req.session.buyNowItem) {
            fromCart = false;
            const product = await Product.findById(req.session.buyNowItem.productId);
            
          if (product) {
const requestedQty=req.session.buyNowItem.quantity||1;

if(product.stock<requestedQty){
    stockValidationFailed=true;
    outOfStockItems.push({
        productId:product._id,
        name:product.productName,
        available:product.stock,
        requested:requestedQty
    })
}

                cartItems = [{
                    id: product._id,
                    name: product.productName,
                    image: product.images[0],
                    variant: req.session.buyNowItem.variant || 'Default',
                    price: product.discountedPrice || product.price,
                      originalPrice:product.price,
                        discountedPrice:product.discountedPrice||null,
                    quantity: req.session.buyNowItem.quantity || 1,
                    isBuyNow: true 
                }];
            }
        } 
        else {
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            console.log("cart inisde the checkout controller:",cart);
            const coupons=await Coupon.find({});
            if (cart) {
for (const item of cart.items){
    if(item.productId&&item.productId.isActive){
        const product=item.productId;
        if(product.stock<item.quantity){
            stockValidationFailed=true;
            outOfStockItems.push({
                productId:product._id,
                name:product.productName,
                available:product.stock,
                requested:item.quantity
            })
        }
    }
}
                cartItems = cart.items
                    .filter(item => item.productId && item.productId.isActive)
                    .map(item => ({
                        id: item.productId._id,
                        name: item.productId.productName,
                        image: item.productId.images[0],
                        variant: item.variant,
                        price: item.productId.discountedPrice||item.productId.price,
                        originalPrice:item.productId.price,
                        discountedPrice:item.productId.discountedPrice||null,
                        quantity: item.quantity,
                        isBuyNow: false,
                       
                    }));
            }
        }
if(stockValidationFailed){
    req.session.outOfStockItems=outOfStockItems;
    return res.redirect('/user/cart?error=some items are out of stock')
}


         const coupons=await Coupon.find({isActive:true}).lean();
const usedOrders=await Order.find({
  userId,
  'appliedCoupon.couponId':{$in:coupons.map(c=>c._id)},
  status:{$nin:['cancelled','returned']}
}).lean();

const usedCouponIds=usedOrders.map(o=>o.appliedCoupon.couponId.toString());

const couponsWithStatus=coupons.map(coupon=>({
  ...coupon,
  isUsed:usedCouponIds.includes(coupon._id.toString())
}));
console.log("couponWithStatus",couponsWithStatus);

       const taxRate = 18;
       
        const offers = await Offer.find({
startDate: { $lte: new Date() },       
  endDate: { $gte: new Date() },            
  isActive: true       
 }).lean();

const orderSummary=calculateOrder(cartItems);  
const discountedPrice=orderSummary.subtotal-orderSummary.discount;
        // Payment methods
        const paymentMethods = [
            { id: 'netbanking', title: 'Net Banking', icon: '🏦', description: 'Pay via Internet Banking' },
            { id: 'cod', title: 'Cash on Delivery', icon: '💰', description: 'Pay when you receive the order' }
        ];
        console.log("orderSummary:",orderSummary);
        
        res.render('user/checkout', {
            orderPlaced: false,
            pageCSS: 'user/checkout.css',
            pageJS: 'user/checkout.js',
            addresses,
            cartItems,
            fromCart, 
            taxRate,
            ...orderSummary,
            discountedPrice,
            offers,
            paymentMethods,
            selectedPayment: '',
            selectedPaymentMethod: 'Cash on Delivery',
            appliedOffers: [],
            user:userData,
            coupons:couponsWithStatus,
             razorpayKey: process.env.RAZORPAY_KEY_ID
        });
        
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).send('Error loading checkout page');
    }
};

exports.addAddress = async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "User not logged in" });
    }

    const {
      name, building, landmark, city, state, pincode,
      phone, altPhone, addressType, isDefault
    } = req.body;

    // Validation
    const errorMsg = validateAddress({ name, building, city, state, pincode, phone, altPhone, addressType });
    if (errorMsg) return res.status(400).json({ success: false, message: errorMsg });

    const duplicate = await Address.findOne({ userId: user.id, "address.phone": phone });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Phone number already exists in another address." });
    }

    let userAddressDoc = await Address.findOne({ userId: user.id });

    if (isDefault && userAddressDoc) {
      userAddressDoc.address.forEach(addr => (addr.isDefault = false));
    }

    const newAddress = {
      userId: user.id,
      name, building, landmark, city, state, pincode,
      phone, altPhone, addressType, isDefault
    };

    if (userAddressDoc) {
      userAddressDoc.address.push(newAddress);
      await userAddressDoc.save();
    } else {
      userAddressDoc = new Address({
        userId: user.id,
        address: [newAddress]
      });
      await userAddressDoc.save();
    }

    res.json({ success: true, address: newAddress });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ success: false, message: "Error adding address" });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not logged in" });
    }

    const addressId = req.params.id;
    const userData = await Address.findOne({ userId });

    if (!userData) {
      return res.status(404).json({ success: false, message: "No addresses found for this user" });
    }

    const address = userData.address.find(addr => addr._id.toString() === addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, address });
  } catch (error) {
    console.error("Get address error:", error);
    res.status(500).json({ success: false, message: "Error getting address" });
  }
};
exports.applyOffer = async (req, res) => {
    try {
        const userId = req.session.user.id;
        console.log("req body i apply offer:",req.body);
        const { offerId } = req.body;
        
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        
        if (offer.userSpecific && offer.userSpecific.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Offer not valid for this user' });
        }
        
        if (offer.validUntil && offer.validUntil < new Date()) {
            return res.status(400).json({ success: false, message: 'Offer has expired' });
        }
        
        res.json({ 
            success: true, 
            offer: {
                id: offer._id,
                title: offer.title,
                description: offer.description,
                discountAmount: offer.discountAmount,
                discountType: offer.discountType,
                code: offer.code
            }
        });
        
    } catch (error) {
        console.log('Apply offer error:', error);
        res.status(500).json({ success: false, message: 'Error applying offer' });
    }
};

exports.placeOrder = async (req, res) => {
  try {
console.log("session inside place order",req.session);
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please log in' });
    }

    console.log("req body inside place order controller", req.body);

    const { addressId, paymentMethod ,appliedOffers=[] } = req.body;
    if (!addressId || !paymentMethod) {
      return res.status(400).jsonginl ({
        success: false,
        message: 'Address and payment method are required'
      });
    }

    let items = [];
    let isBuyNow = false;

    if (req.session.buyNowItem) {
      const { productId, quantity = 1, variant = 'Default', price } = req.session.buyNowItem;
      const product = await Product.findById(productId);

      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: 'Product not available' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough stock' });
      }

      const effectivePrice = price || product.discountedPrice || product.price;
      items = [{
        productId: product._id,
        name: product.productName,
        variant,
        quantity,
        price: product.price,
        discountedPrice: product.discountedPrice || null,
        totalPrice: effectivePrice * quantity
      }];

      isBuyNow = true;
    }

    else {
     
      const cart = await Cart.findOne({ userId }).populate({
  path: 'items.productId',
  select: 'productName price discountedPrice stock isActive'
});


      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      const activeCartItems = cart.items.filter(item => item.productId && item.productId.isActive);
      items = activeCartItems.map(item => {
        const effectivePrice = item.productId.discountedPrice || item.productId.price;
        return {
          productId: item.productId._id,
          name: item.productId.productName,
          variant: item.variant || 'Default',
          quantity: item.quantity,
          price: item.productId.price,
          discountedPrice: item.productId.discountedPrice || null,
          totalPrice: effectivePrice * item.quantity
        };
      });
    }

//address selection
    const addresses = await Address.findOne(
      { userId, 'address._id': addressId },
      { address: { $elemMatch: { _id: addressId } } }
    );

    if (!addresses || addresses.address.length === 0) {
      return res.status(400).json({ success: false, message: 'Address not found' });
    }

    const selectedAddress = addresses.address[0];

//coupon
let appliedCouponData=null;
let appliedCoupon=req.session.appliedCoupon||null;
console.log("just chehing applied coupon:",appliedCoupon);

// if(appliedCoupon){
//   const coupon=await Coupon.findOne({_id:appliedCoupon.couponId,isActive:true,validTill:{$gte:new Date()}})
//  if (coupon) {
//         appliedCouponData = {
//             couponId: coupon._id,
//             code: coupon.code,
//             type: coupon.discountType||'fixed',
//             value: coupon.discountValue||0
//         };
 
//   if(!coupon) appliedCoupon=null;
// }
console.log("coupon inside the place order controller :",appliedCoupon);

    //order summary
    const cartItemsForCalculation = items.map(item => ({
      originalPrice: item.price,
      discountedPrice: item.discountedPrice || null,
      quantity: item.quantity,
    }));
    const orderSummary = calculateOrder(cartItemsForCalculation, { coupon: appliedCoupon, taxRate: 18 });

    const { subtotal, delivery, offerDiscount, couponDiscount, discount, tax, total } = orderSummary;

    // order creation 
    const status = paymentMethod === 'cod' ? 'pending' : 'processing';
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = new Order({
      orderId,
      userId,
      items,
      shippingAddress: selectedAddress,
      paymentMethod,
      subtotal,
      delivery,
      tax,
      discount,
      total,
      status,
      appliedOffers: appliedOffers.map(o => o.id),
      appliedCoupon: appliedCoupon
    });

    await order.save();
//reducing the stock quantity 
if(paymentMethod==="cod"){
await Product.bulkWrite(
  items.map(item=>({
    updateOne:{
      filter:{_id:item.productId},
      update:{$inc:{stock:-item.quantity}}
    }
  }))
)
if(appliedCoupon){
  await Coupon.findByIdAndUpdate(appliedCoupon.couponId,{
    $inc:{usedCount:1}
  });
}

}


//clearing cart 
    if (!isBuyNow) {
      await Cart.updateOne(
        { userId },
        { $pull: { items: { productId: { $in: items.map(i => i.productId) } } } }
      );
    } else {
      delete req.session.buyNowItem;
    }

//razorpay method 
    if (paymentMethod === 'netbanking') {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: total * 100, // amount in paise
        currency: "INR",
        receipt: orderId,
      });

      console.log("razorpayOrder", razorpayOrder);
      return res.json({
        dborderID: order.orderId,
        success: true,
        orderId: razorpayOrder.id,
        order: razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID
      });
    }

    return res.json({
      success: true,
      orderId: order.orderId,
      order: { id: order._id, total, status: order.status, createdAt: order.createdAt }
    });

  


}catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing order',
      details: error?.message || error
    });
  }
};

exports.successPage=async(req,res)=>{
     try {
        console.log("enter success controller")
    const orderId=req.params.orderId;
    console.log(orderId);
const order = await Order.findOne({orderId:orderId})
  .populate('userId') 
  .populate('items.productId'); 
    console.log("order:",order)
    if(!order){
        return res.status(404).render('error',{
            message:'Order not found '
        });
    }
 const orderData = {
    storeName: "Chettinad sarees",
    customerName: order.userId.name,           
    customerEmail: order.userId.email,
    orderId: orderId,
    deliveryDate: new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    continueShoppingUrl: "/user/shopAll",
    orderItems: order.items.map(item => ({
        name: item.name,
        imageUrl: item.productId.images[0] || '/images/default-product.jpg',  
        quantity: item.quantity,
        price: item.price
    }))
};
            console.log("order data:",orderData);

 res.render('user/successPage',{ 
    ...orderData,
layout:false,
pageCSS:'user/successPage.css',
pageJS:'user/successPage.js'
 });
        }
        catch(error){
           console.error(' Error fetching order:', error);
           

        }
}

exports.failurePage = async (req, res) => {
    try {
        console.log("enter failure controller");
        const orderId = req.params.orderId;
        console.log(orderId);
        const order = await Order.findOne({ orderId: orderId })
            .populate('userId')
            .populate('items.productId');
        console.log("order:", order);
        if (!order) {
            return res.status(404).render('error', {
                message: 'Order not found'
            });
        }
        const failureData = {
            storeName: "Chettinad Sarees",
            customerName: order.userId.name,
            customerEmail: order.userId.email,
            orderId: order.orderNumber || order._id,
            failureMessage: "Your payment didn't go through as it was declined by the bank. Try another payment method or contact your bank.",
            retryPaymentUrl: `/user/checkout/${orderId}`,
            goToHomeUrl: "/user/shopAll"
        };
        console.log("failure data:", failureData);

        res.render('user/failurePage', {
            ...failureData,
            layout: false,
            pageCSS: 'user/failurePage.css',
            pageJS: 'user/failurePage.js'
        });
    } catch (error) {
        console.error('Error fetching order:', error);
    }
}


exports.buyNow=async(req,res)=>{
    try {
        const{productId,variant,quantity,price}=req.body;

        req.session.buyNowItem={
            productId,
            variant,
            quantity,
            price
        }
        res.status(200).json({ success: true });
    } catch (error) {
         console.error('Buy Now error:', err);
        res.redirect('user/shopAll' + req.body.productId);
    }
}
