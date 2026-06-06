<<<<<<< Updated upstream
import { STATUS_CODES } from '../../utils/statusCodes.js';
import logger from '../../utils/logger.js';
import *  as checkoutService from '../../service/user/checkout.service.js';
=======
// controllers/checkoutController.js
const mongoose = require("mongoose");
const razorpayInstance=require('../../config/razorpay.js');
const User=require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Offer = require('../../models/offerSchema');
>>>>>>> Stashed changes

export const getCheckoutPage=async(req,res)=>{
  logger.info('loading checkout page');
  if(!req.session.user){
    return res.status(STATUS_CODES.UNAUTHORIZED).json({success:false,message:"please login to continue"});

<<<<<<< Updated upstream
  }

  const userId=req.session.user.id;
  const{addresses,cartItems,fromCart,taxRate,orderSummary,offers,paymentMethods,coupons}=await checkoutService.getCheckoutData(userId,req.session);

if(orderSummary.stockValidationFailed){
  req.session.outOfStickItems=orderSummary.outOfStockItems;
  return res.redirect('/user/cart?error=some items are out of stock')
}

res.render('user/checkout',{
  orderPlaced:false,
  pageCSS:'user/checkout.css',
  pageJS:'user/checkout.js',
  addresses,
  cartItems,
  fromCart,
  taxRate,
  ...orderSummary,
  discountedPrice:orderSummary.subtotal-orderSummary.discount,
  offers,
  paymentMethods,
  selectedPayment:'',
  selectedPaymentMethod:'Cash on Delivery',
  appliedOffers:[],
  user:req.session.user,
  coupons,
  razorpayKey:process.env.RAZORPAY_KEY_ID
});

=======
        const userData= await User.findById(userId);
        
        const addresses = await Address.find({ userId }).lean();
        
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
                    name: product.name,
                    image: product.images[0],
                    variant: req.session.buyNowItem.variant || 'Default',
                    price: req.session.buyNowItem.price || product.price,
                    quantity: req.session.buyNowItem.quantity || 1,
                    isBuyNow: true 
                }];
            }
        } 
        else {
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (cart) {
for (const item of cart.items){
    if(item.productId&&item.productId.isActive){
        const product=item.productId;
        if(product.stock<item.quantity){
            stockValidationFailed=true;
            outOfStockItems.push({
                productId:product._id,
                name:product.name,
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
                        name: item.productId.name,
                        image: item.productId.images[0],
                        variant: item.variant,
                        price: item.price,
                        quantity: item.quantity,
                        isBuyNow: false
                    }));
            }
        }
        
if(stockValidationFailed){
    req.session.outOfStockItems=outOfStockItems;
    return res.redirect('/user/cart?error=some items are out of stock')
}


        // Calculate order totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 500 ? 0 : 50;
        const taxRate = 18;
        const tax = subtotal * (taxRate / 100);
        const discount = 0;
        const total = subtotal + delivery + tax - discount;
        
        const offers = await Offer.find({
startDate: { $lte: new Date() },       
  endDate: { $gte: new Date() },            
  isActive: true       
 }).lean();

        console.log("offers in checkout:",offers);
        
        // Payment methods
        const paymentMethods = [
            // { id: 'credit_card', title: 'Credit Card', icon: '💳', description: 'Pay with your credit card' },
            // { id: 'debit_card', title: 'Debit Card', icon: '💳', description: 'Pay with your debit card' },
            // { id: 'upi', title: 'UPI', icon: '📱', description: 'Pay using any UPI app' },
            { id: 'netbanking', title: 'Net Banking', icon: '🏦', description: 'Pay via Internet Banking' },
            { id: 'cod', title: 'Cash on Delivery', icon: '💰', description: 'Pay when you receive the order' }
        ];
        
        res.render('user/checkout', {
            orderPlaced: false,
            pageCSS: 'user/checkout.css',
            pageJS: 'user/checkout.js',
            addresses,
            cartItems,
            fromCart, 
            subtotal,
            delivery,
            taxRate,
            tax,
            discount,
            total,
            offers,
            paymentMethods,
            selectedPayment: '',
            selectedPaymentMethod: 'Cash on Delivery',
            appliedOffers: [],
            user:userData
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
    console.log(" No active user session.");
    return res.status(401).json({ success: false, message: 'User not logged in' });
}

const userId = user.id;  
console.log("rwq body:",req.body)   
   const { 
            name, 
            building,
            landmark, 
            city, 
            state, 
            pincode, 
            phone,
            altPhone, 
            addressType, 
            isDefault 
        } = req.body;
           let userAddressDoc = await Address.findOne({ userId });
        // If setting as default, unset any existing default
        if (isDefault && userAddressDoc) {
      userAddressDoc.address.forEach(addr => addr.isDefault = false);
    }
        
        const newAddress = {
            userId: userId,
            name,
           building,
           landmark,
            city,
            state,
            pincode,
            phone,
            altPhone,
            addressType,
            isDefault
        };
        
       if (userAddressDoc) {
      userAddressDoc.address.push(newAddress);
      await userAddressDoc.save();
    } else {
      userAddressDoc = new Address({
        userId,
        address: [newAddress]
      });
      await userAddressDoc.save();
    }

    res.json({ success: true, address: newAddress});
}catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ success: false, message: 'Error adding address' });
  };
}
exports.updateAddress = async (req, res) => {
    try {
        const user = req.session?.user;

        if (!user || !user.id) {
            console.log(" No active user session.");
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const addressId = req.params.id;

        const { 
            name, 
            building,
            landmark,
            city, 
            state, 
            pincode, 
            phone, 
            altPhone,
            addressType,
            isDefault 
        } = req.body;
//validation
 if (!name?.trim() || !building || !city || !state || !pincode || !phone || !addressType) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled properly.' });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits.' });
        }


 const duplicate = await Address.findOne({
            userId: user.id,
            "address.phone": phone,
            "address._id": { $ne: new mongoose.Types.ObjectId(addressId) }
        });

        if (duplicate) {
            return res.status(409).json({ success: false, message: 'Phone number already exists in another address.' });
        }

        // Unset existing default if this one is marked as default
        if (isDefault) {
            await Address.updateMany(
                { userId: user.id, isDefault: true },
                { $set: { isDefault: false } }
            );
        }
console.log("userId:",user.id, "| type:", typeof user.id);
console.log("_id:", addressId, "| type:", typeof addressId);

      const updatedAddress = await Address.findOneAndUpdate(
  {
    userId: new mongoose.Types.ObjectId(user.id),
    "address._id": new mongoose.Types.ObjectId(addressId)
  },
  {
    $set: {
      "address.$.name": name,
      "address.$.building": building,
      "address.$.landmark": landmark,
      "address.$.city": city,
      "address.$.state": state,
      "address.$.pincode": pincode,
      "address.$.phone": phone,
      "address.$.altPhone": altPhone,
      "address.$.addressType": addressType,
      "address.$.isDefault": isDefault
    }
  },
  { new: true }
);

        if (!updatedAddress) {
            console.log(`⚠️ No address found for ID: ${addressId} and User: ${user.id}`);
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        console.log(" Address updated:", updatedAddress);
        res.json({ success: true, address: updatedAddress });

    } catch (error) {
        console.error(' Update address error:', error);
        res.status(500).json({ success: false, message: 'Error updating address' });
    }
};

exports.getAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;
        console.log(userId);
        console.log(addressId);

const userData = await Address.findOne({ userId });
const address = userData.address.find(addr => addr._id.toString() === addressId);
        
        if (!address) {
            return res.
            status(404).json({ success: false, message: 'Address not found' });
        }
        
        res.json({ success: true, address });
    } catch (error) {
        console.error('Get address error:', error);
        res.status(500).json({ success: false, message: 'Error getting address' });
    }
};

exports.applyOffer = async (req, res) => {
    try {
        const userId = req.session.user.id;
        console.log("req body i apply offer:",req.body);
        const { offerId } = req.body;
        
        // Get the offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        
        // Check if offer is valid for this user
        if (offer.userSpecific && offer.userSpecific.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Offer not valid for this user' });
        }
        
        // Check if offer is expired
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
        console.log("inside place order controller")
        const userId = req.session.user.id;
        const { 
            addressId, 
            paymentMethod, 
            appliedOffers = [] ,
        
        } = req.body;
  if (!addressId || !paymentMethod) {
            return res.status(400).json({ 
                success: false, 
                message: 'Address and payment method are required' 
            });
        }
        let items=[];
        let isBuyNow=false;
        let productIdForStockUpdate=null;
        let quantityForStockUpdate=null;
const orderId=`ORD=${Date.now()}-${Math.floor(Math.random()*1000)}`;

if(req.session.buyNowItem){
    const{productId,quantity=1,variant='Default',price}=req.session.buyNowItem;
    console.log("productId:",productId);
    const product=await Product.findByIdAndUpdate(productId);

    if(!product||!product.isActive){
        return res.status(400).json({success:false,message:'Product is not available'})
    }

    if(product.stock<quantity){
        return res.status(400).json({success:false,message:'not enough products available '})
    }

     productIdForStockUpdate = productId;
     quantityForStockUpdate = quantity;


    items=[{
        productId:product._id,
        name:product.productName,
        variant,
        quantity,
        price:price||product.price,
        totalPrice:(price||product.price)*quantity
    }]
    isBuyNow=true;
}else{


        
        // Get cart items
const cart = await Cart.findOne({ userId: userId }).populate({
  path: 'items.productId',
   match: { isActive: true },
  select: 'productName price stock'
});

if (!cart || cart.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cart is empty' 
            });
        }


        console.log("cart items:",cart);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        const activeCartItems = cart.items.filter(item => item.productId !== null);
 items = activeCartItems.map(item => ({
                productId: item.productId._id,
                name: item.productId.productName,
                variant: item.variant || 'Default',
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.price * item.quantity
            }));

  

} 
 



        // Get address
const addresses = await Address.findOne(
  { userId: userId, 'address._id': new mongoose.Types.ObjectId(addressId) },
  { address: { $elemMatch: { _id: new mongoose.Types.ObjectId(addressId) } } }
);
        console.log("addresses:",addresses)
        if (!addresses) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }
 if (!addresses || addresses.address.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Address not found' 
            });
        }


        const selectedAddress=addresses.address[0];
        // Calculate order totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 500 ? 0 : 50;
        const taxRate = 18;
        const tax = subtotal * (taxRate / 100);
        
        // Calculate discount from offers (simplified)
        let discount = 0;
        
        const total = subtotal + delivery + tax - discount;
       

        if(paymentMethod==='cod'){
            status='ordered';
            await updateStockAfterOrder(items);

        // Create order
        const order = new Order({
            orderId:orderId,
            userId: userId,
          items:items,
          shippingAddress: {
    name: selectedAddress.name,
    building: selectedAddress.building,
    landmark: selectedAddress.landmark,
    city: selectedAddress.city,
    state: selectedAddress.state,
    pincode: selectedAddress.pincode,
    phone: selectedAddress.phone,
    altPhone: selectedAddress.altPhone
},
            paymentMethod,
            subtotal,
            delivery,
            tax,
            discount,
            total,
            status:'ordered',
            appliedOffers: appliedOffers.map(offer => offer.id)
        });
        await order.save();

//updating the stock

if(req.session.buyNowItem){
    await Product.findByIdAndUpdate(productIdForStockUpdate,{
        $inc:{stock:-quantityForStockUpdate}
    });
    delete req.session.buyNowItem;
}else{
    for(const item of items){
        await Product.findByIdAndUpdate(item.productId,{
            $inc:{stock:-item.quantity}
        })  
    }
    await Cart.findByIdAndUpdate(
        {userId:userId},
        {$set:{item:[]}}
    );
        }
        return res.json({
            success:true,
            orderId:order.orderId,
            order:{
                id:order._id,
                total:total,
                status:order.status,
                status:order.status,
                createdAt:order.createdAt
            }
        });

        }else if(paymentMethod==='razorpay'||paymentMethod==='netbanking'){
//creating razorpay order
const pendingOrder=new Order({
    orderId:orderId,
    userId:userId,
     items: items,
                shippingAddress: {
                    name: selectedAddress.name,
                    building: selectedAddress.building,
                    landmark: selectedAddress.landmark,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    pincode: selectedAddress.pincode,
                    phone: selectedAddress.phone,
                    altPhone: selectedAddress.altPhone
                },
                paymentMethod: 'razorpay',
                paymentStatus: 'pending',
                subtotal,
                delivery,
                tax,
                discount,
                total,
                status:'pending',
                appliedOffers:appliedOffers.map(offer=>offer.id)
});
await pendingOrder.save();

const razorpayOrder=await razorpayInstance.orders.create({
    amount:total*100,
    currency:'INR',
    receipt:orderId,
    payment_capture:1
});

//updating order with razorpay orderId
pendingOrder.razorpayOrderId=razorpayOrder.id;
await pendingOrder.save();

return res.json({
    success:true,
    razorpay:true,
    order:{
        id:pendingOrder._id,
        orderId:pendingOrder.orderId,
        total:total
    },
    razorpayOrder:{
        id:razorpayOrder.id,
        amount:razorpayOrder.amount,
        currency:razorpayOrder.currency,
        key_id:process.env.RAZORPAY_KEY_ID
    }
});
           
        }
    }catch(error){
            console.log('Place Order error:',error);
            res.status(500).json({success:false,message:'Error placing order:'+error.message});
        }
    }
    
       
       
       
       
       


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
    orderId: order.orderNumber || order._id,
    deliveryDate: new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    continueShoppingUrl: "/shopAll",
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
>>>>>>> Stashed changes
}

export const getRetryCheckoutPage=async(req,res)=>{
  logger.info('loading retry checkout page');
  const userId=req.session.user?.id;
  if(!userId){
    return res.status(STATUS_CODES.UNAUTHORIZED).json({success:false,message:"please login to continue"});
  }
  const orderId=req.params.orderId;
  const retryData=await checkoutService.getRetryCheckoutData(userId,orderId);
  if(!retryData.success){
    return res.status(STATUS_CODES.NOT_FOUND).send(retryData.message);

  }
  res.render('user/checkout',{
    orderPlaced:false,
    pageCSS:'user/checkout.css',
    pageJS:'user/checkout.js',
    addresses:retryData.addresses,
    cartItems:retryData.cartItems,
    fromCart:false,
    taxRate:18,
    ...retryData.orderSummary,
    discountedPrice:retryData.orderSummary.subtotal-retryData.orderSummary.discount,
    offers:[],
    paymentMethods:retryData.paymentMethods,
    selectedPayment:retryData.order.paymentMethod,
    selectedPaymentMethod:retryData.order.paymentMethod,
    appliedOffers:retryData.order.appliedOffers,
    user:retryData.order.userId,
    coupons:retryData.coupons,
    // razorpayKey:process.env.,
    retryOrderId:retryData.order._id,
    isRetry:true,
    retryCartItems:retryData.cartItems
  })
}

export const addAddress=async(req,res)=>{
  logger.info("adding new address");
  const userId=req.session.user.id;
  if(!userId){
    return res.status(STATUS_CODES.UNAUTHORIZED).json({success:false,message:"PLEASE LOGIN TO CONTINUE"});

  }
  const addressData={...req.body,userId};
  const result=await checkoutService.addAddressFromCheckout(addressData);
  if(!result.success){
    logger.warn('Add address failed');
    return res.status(STATUS_CODES.BAD_REQUEST).json({success:false,message:"adding address from the checkout page gets failed"});

  }
  res.json({success:true,address:result.address});
}

export const getAddress=async(req,res)=>{
  logger.info('Getting address');
  const userId=req.session.user.id;
  if(!userId){
    return res.status(STATUS_CODES.UNAUTHORIZED).json({success:false,message:'LOGIN TO CONTINUE'});
      }
      console.log('params in get address:',req.params);
      const addressId=req.params.id;
      const result=await checkoutService.getAddress(userId,addressId);
      if(!result.success){
        logger.warn('get address failed',{error:result.message})
      }
      res.json({success:true,address:result.address});
}

export const applyOffer=async(req,res)=>{
  logger.info('Applying offer');
  const userId=req.session.user.id;
  const {offerId}=req.body;
  const result=await checkoutService.applyOffer(userId,offerId);
  if(!result.success){
    logger.warn('Applied offer failed',{error:result.message});
    return res.status(STATUS_CODES.BAD_REQUEST).json({success:false,message:"applying offer gets failed"});
  }
  res.json({
    success:true,
    offer:result.offer
  });
}

export const placeOrder=async (req,res)=>{
  logger.info('Placing order');
  const userId=req.session.user.id;
  if(!userId){
    return res.status(STATUS_CODES.UNAUTHORIZED).json({success:false,message:"please login to continue"});
      }
console.log("req.body",req.body);
      const{addressId,paymentMethod,appliedOffers=[],isRetry=false}=req.body||{};
      const orderData={userId,addressId,paymentMethod,appliedOffers,isRetry,session:req.session};
      const result=await checkoutService.placeOrder(orderData);
      if(!result.success){
        logger.warn('place order failed',{error:result.message});
        return res.status(STATUS_CODES.BAD_REQUEST).json({success:false,message:result.message});

      }
      if(paymentMethod==='netbanking'){
        return res.json({
          dborderID: result.order.orderId,
      success: true,
      orderId: result.razorpayOrder.id,
      order: result.razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
        })
      }
      res.json({
    success: true,
    orderId: result.order.orderId,
    order: { id: result.order._id, total: result.order.total, status: result.order.status, createdAt: result.order.createdAt }
  });
}

export const failurePage = async (req, res) => {
  logger.info('Loading failure page');
  const orderId = req.params.orderId;
  const failureData = await checkoutService.getOrderForFailure(orderId);
  if (!failureData.success) {
    return res.status(STATUS_CODES.NOT_FOUND).render('error', { message:"ORDER NOT FOUND"});
  }

  res.render('user/failurePage', {
    ...failureData,
    layout: false,
    pageCSS: 'user/failurePage.css',
    pageJS: 'user/failurePage.js'
  });
};

export const successPage = async (req, res) => {
  logger.info('Loading success page');
  const orderId = req.params.orderId;
  const orderData = await checkoutService.getOrderForSuccess(orderId);
  if (!orderData.success) {
    return res.status(STATUS_CODES.NOT_FOUND).render('error', { message:"order not found"});
  }

  res.render('user/successPage', {
    ...orderData.orderData,
    layout: false,
    pageCSS: 'user/successPage.css',
    pageJS: 'user/successPage.js'
  });
};

export const buyNow=async(req,res)=>{
  logger.info('Setting buy now session');
  const {productId,variant,quantity,price}=req.body;
  req.session.buuNowItem={productId,variant,quantity,price};
  res.status(STATUS_CODES.CREATED).json({success:true});
  
}