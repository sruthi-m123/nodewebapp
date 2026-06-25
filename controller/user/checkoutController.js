import { STATUS_CODES } from '../../utils/statusCodes.js';
import logger from '../../utils/logger.js';
import * as checkoutService from '../../service/user/checkout.service.js';

export const getCheckoutPage = async (req, res) => {
  logger.info('loading checkout page');
  if (!req.session.user) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "please login to continue" });
  }
  const userId = req.session.user.id;

  const { addresses, cartItems, fromCart, taxRate, orderSummary, offers, paymentMethods, coupons,wallet } = await checkoutService.getCheckoutData(userId, req.session);
  console.log("items inside the cart :",cartItems);
if(!cartItems||cartItems.length===0){
  return res.redirect('/user/cart');
}


  if (orderSummary.stockValidationFailed) {
    req.session.outOfStickItems = orderSummary.outOfStockItems;
    return res.redirect('/user/cart?error=some items are out of stock');
  }
  

  res.render('user/checkout', {
    orderPlaced: false,
    pageCSS: 'user/checkout.css',
    pageJS: 'user/checkout.js',
    addresses,
    cartItems,
    fromCart,
    taxRate,
    ...orderSummary,
    discountedPrice: orderSummary.subtotal - orderSummary.discount,
    offers,
    paymentMethods,
    selectedPayment: '',
    selectedPaymentMethod: 'Cash on Delivery',
    appliedOffers: [],
    user: req.session.user,
    isRetry:false,
    coupons,
    wallet,
    razorpayKey: process.env.RAZORPAY_KEY_ID
  });
};

export const getRetryCheckoutPage = async (req, res) => {
  logger.info('loading retry checkout page');
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "please login to continue" });
  }
  const orderId = req.params.orderId;
  console.log("orderId",orderId);
  const retryData = await checkoutService.getRetryCheckoutData(userId, orderId);
  if (!retryData.success) {
    return res.status(STATUS_CODES.NOT_FOUND).send(retryData.message);
  }
  res.render('user/checkout', {
    orderPlaced: false,
    pageCSS: 'user/checkout.css',
    pageJS: 'user/checkout.js',
    addresses: retryData.addresses,
    cartItems: retryData.cartItems,
    fromCart: false,
    taxRate: 18,
    ...retryData.orderSummary,
    discountedPrice: retryData.orderSummary.subtotal - retryData.orderSummary.discount,
    offers: [],
    paymentMethods: retryData.paymentMethods,
    selectedPayment: retryData.order.paymentMethod,
    selectedPaymentMethod: retryData.order.paymentMethod,
    appliedOffers: retryData.order.appliedOffers,
    user: retryData.order.userId,
    coupons: retryData.coupons,
    retryOrderId: retryData.order._id,
    isRetry: true,
    retryCartItems: retryData.cartItems,
    wallet:retryData.wallet
  });
};

export const addAddress = async (req, res) => {
  logger.info("adding new address");
  const userId = req.session.user.id;
  if (!userId) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "PLEASE LOGIN TO CONTINUE" });
  }
  const addressData = { ...req.body, userId };
  const result = await checkoutService.addAddressFromCheckout(addressData);
  if (!result.success) {
    logger.warn('Add address failed');
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "adding address from the checkout page gets failed" });
  }
  res.json({ success: true, address: result.address });
};

export const getAddress = async (req, res) => {
  logger.info('Getting address');
  const userId = req.session.user.id;
  if (!userId) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'LOGIN TO CONTINUE' });
  }
  console.log('params in get address:', req.params);
  const addressId = req.params.id;
  const result = await checkoutService.getAddress(userId, addressId);
  if (!result.success) {
    logger.warn('get address failed', { error: result.message });
  }
  res.json({ success: true, address: result.address });
};

export const applyOffer = async (req, res) => {
  logger.info('Applying offer');
  const userId = req.session.user.id;
  const { offerId } = req.body;
  const result = await checkoutService.applyOffer(userId, offerId);
  if (!result.success) {
    logger.warn('Applied offer failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "applying offer gets failed" });
  }
  res.json({
    success: true,
    offer: result.offer
  });
};

export const placeOrder = async (req, res) => {
  logger.info('inside Placing order');
  const userId = req.session.user.id;
  if (!userId) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "please login to continue" });
  }
  
  const { addressId, paymentMethod, appliedOffers = [], isRetry = false } = req.body || {};
  const orderData = { userId, addressId, paymentMethod, appliedOffers, isRetry, session: req.session };
   
  const result = await checkoutService.placeOrder(orderData);
  
  if (!result.success) {
    logger.warn('place order failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: result.message });
  }
  if (paymentMethod === 'netbanking') {
    return res.json({
      dborderID: result.order.orderId,
      success: true,
      orderId: result.razorpayOrder.id,
      order: result.razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });
  }
  res.json({
    success: true,
    orderId: result.order.orderId,
    order: { id: result.order._id, total: result.order.total, status: result.order.status, createdAt: result.order.createdAt }
  });
};

export const failurePage = async (req, res) => {
  logger.info('Loading failure page');
  const orderId = req.params.orderId;
  const failureData = await checkoutService.getOrderForFailure(orderId);
  if (!failureData.success) {
    return res.status(STATUS_CODES.NOT_FOUND).render('error', { message: "ORDER NOT FOUND" });
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
    return res.status(STATUS_CODES.NOT_FOUND).render('error', { message: "order not found" });
  }
  res.render('user/successPage', {
    ...orderData.orderData,
    layout: false,
    pageCSS: 'user/successPage.css',
    pageJS: 'user/successPage.js'
  });
};

export const buyNow = async (req, res) => {
  logger.info('Setting buy now session');
  const { productId, variant, quantity, price } = req.body;
  req.session.buyNowItem = { productId, variant, quantity, price };
  res.status(STATUS_CODES.CREATED).json({ success: true });
};
