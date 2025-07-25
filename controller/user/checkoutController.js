// controllers/checkoutController.js

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
        console.log("cart items:",cart);
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
            console.log("❌ No active user session.");
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

        // Unset existing default if this one is marked as default
        if (isDefault) {
            await Address.updateMany(
                { userId: user._id, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, userId: user._id },
            {
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
            },
            { new: true }
        );

        if (!updatedAddress) {
            console.log(`⚠️ No address found for ID: ${addressId} and User: ${user._id}`);
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        console.log("✅ Address updated:", updatedAddress);
        res.json({ success: true, address: updatedAddress });

    } catch (error) {
        console.error('🔥 Update address error:', error);
        res.status(500).json({ success: false, message: 'Error updating address' });
    }
};

exports.getAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.id;
        
        const address = await Address.findOne({ _id: addressId, user: userId });
        
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
        
        // Here you would typically calculate the discount based on the offer
        // For simplicity, we'll just return the offer details
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
        const userId = req.user._id;
        const { 
            addressId, 
            paymentMethod, 
            appliedOffers = [] 
        } = req.body;
        
        // Get cart items
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        
        // Get address
        const address = await Address.findOne({ _id: addressId, user: userId });
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }
        
        // Calculate order totals
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 500 ? 0 : 50;
        const taxRate = 18;
        const tax = subtotal * (taxRate / 100);
        
        // Calculate discount from offers (simplified)
        let discount = 0;
        // In a real app, you would calculate discount based on applied offers
        
        const total = subtotal + delivery + tax - discount;
        
        // Create order
        const order = new Order({
            user: userId,
            items: cart.items.map(item => ({
                product: item.product._id,
                variant: item.variant,
                quantity: item.quantity,
                price: item.price
            })),
            shippingAddress: {
                name: address.name,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                phone: address.phone
            },
            paymentMethod,
            subtotal,
            delivery,
            tax,
            discount,
            total,
            status: 'pending',
            appliedOffers: appliedOffers.map(offer => offer.id)
        });
        
        await order.save();
        
        // Clear the cart
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );
        
      res.json({ 
  success: true, 
  orderId: order._id,
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