// controllers/checkoutController.js
const mongoose = require("mongoose");

const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Offer = require('../../models/offerSchema');

exports.getCheckoutPage = async (req, res) => {
    try {
        console.log("inside checkout controller")
        // Get user ID from session or auth middleware
       
        const userId = req.session.user._id;
        console.log("userid:",userId);
        // Get user addresses
        const addresses = await Address.find({  userId }).lean();
        console.log("addresses:",addresses)
        // Get cart items
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        const cartItems = cart.items
        .filter(item=>item.productId&&item.productId.isActive)
        .map(item => ({
            id: item.productId._id,
            name: item.productId.name,
            image: item.productId.images[0],
            variant: item.variant,
            price: item.price,
            quantity: item.quantity
        }));
        
        // Calculate order totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 500 ? 0 : 50; // Free delivery for orders over 500
        const taxRate = 18; // GST 18%
        const tax = subtotal * (taxRate / 100);
        const discount = 0; // Will be calculated when offers are applied
        const total = subtotal + delivery + tax - discount;
        
        // Get available offers
        const offers = await Offer.find({
            $or: [
                { userSpecific: userId },
                { userSpecific: null }
            ],
            validUntil: { $gte: new Date() }
        }).lean();
        
        // Payment methods
        const paymentMethods = [
            { id: 'credit_card', title: 'Credit Card', icon: '💳', description: 'Pay with your credit card' },
            { id: 'debit_card', title: 'Debit Card', icon: '💳', description: 'Pay with your debit card' },
            { id: 'upi', title: 'UPI', icon: '📱', description: 'Pay using any UPI app' },
            { id: 'netbanking', title: 'Net Banking', icon: '🏦', description: 'Pay via Internet Banking' },
            { id: 'cod', title: 'Cash on Delivery', icon: '💰', description: 'Pay when you receive the order' }
        ];
        
        // Default selected payment
        const selectedPayment = 'cod';
        const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedPayment)?.title || 'Cash on Delivery';
        
        res.render('user/checkout', {
          orderPlaced: false,
            pageCSS:'user/checkout.css',
            pageJS:'user/checkout.js',
            addresses,
            cartItems,
            subtotal,
            delivery,
            taxRate,
            tax,
            discount,
            total,
            offers,
            paymentMethods,
            selectedPayment,
            selectedPaymentMethod,
            appliedOffers: []
        });
        
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).send('Error loading checkout page');
    }
};

exports.addAddress = async (req, res) => {
    try {
const user = req.session?.user;

if (!user || !user._id) {
    console.log(" No active user session.");
    return res.status(401).json({ success: false, message: 'User not logged in' });
}

const userId = user._id;  
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

        if (!user || !user._id) {
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
            userId: user._id,
            "address.phone": phone,
            "address._id": { $ne: new mongoose.Types.ObjectId(addressId) }
        });

        if (duplicate) {
            return res.status(409).json({ success: false, message: 'Phone number already exists in another address.' });
        }

        // Unset existing default if this one is marked as default
        if (isDefault) {
            await Address.updateMany(
                { userId: user._id, isDefault: true },
                { $set: { isDefault: false } }
            );
        }
console.log("userId:",user._id, "| type:", typeof user._id);
console.log("_id:", addressId, "| type:", typeof addressId);

      const updatedAddress = await Address.findOneAndUpdate(
  {
    userId: new mongoose.Types.ObjectId(user._id),
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
            console.log(`⚠️ No address found for ID: ${addressId} and User: ${user._id}`);
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
        const userId = req.session.user._id;
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
        const userId = req.user._id;
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
        console.error('Apply offer error:', error);
        res.status(500).json({ success: false, message: 'Error applying offer' });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        console.log("user in place order:",req.session.user);
        const userId = req.session.user._id;

        const { 
            addressId, 
            paymentMethod, 
            appliedOffers = [] 
        } = req.body;
        
        // Get cart items
const cart = await Cart.findOne({ userId: userId }).populate({
  path: 'items.productId',
   match: { isActive: true },
  select: 'productName price'
});
        console.log("cart items:",cart);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        const activeCartItems = cart.items.filter(item => item.productId !== null);

        // Get address
        console.log("addressId:",addressId);
        console.log("user:",userId);
const addresses = await Address.findOne(
  { userId: userId, 'address._id': new mongoose.Types.ObjectId(addressId) },
  { address: { $elemMatch: { _id: new mongoose.Types.ObjectId(addressId) } } }
);
        console.log("addresses:",addresses)
        if (!addresses) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }
        const selectedAddress=addresses.address[0];
        // Calculate order totals
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 500 ? 0 : 50;
        const taxRate = 18;
        const tax = subtotal * (taxRate / 100);
        
        // Calculate discount from offers (simplified)
        let discount = 0;
        
        const total = subtotal + delivery + tax - discount;
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create order
        const order = new Order({
            orderId:orderId,
            userId: userId,
           items: activeCartItems.map(item => ({
  productId: item.productId._id,
  name: item.productId.productName,
  variant: item.variant || "Default",
  quantity: item.quantity,
  price: item.price,
  totalPrice: item.price * item.quantity
})),

           
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
            paymentMethod:paymentMethod.toUpperCase(),
            subtotal,
            delivery,
            tax,
            discount,
            total,
            status: 'pending',
            appliedOffers: appliedOffers.map(offer => offer.id)
        });
        console.log("order Items:",order);
        await order.save();
        
        // Clear the cart
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );
        
      res.json({ 
  success: true, 
  orderId: order.orderId,
  order: {
    id: order._id,
    total,
    status: order.status,
    createdAt: order.createdAt
  }
});

        
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({ success: false, message: 'Error placing order' });
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


}