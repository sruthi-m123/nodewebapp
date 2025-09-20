const Cart=require('../models/cartSchema')


const setUserAndCartCount = async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;

  if (req.session.user) {
    try {
      const cart = await Cart.findOne({ userId: req.session.user._id });
      res.locals.cartCount = cart ? cart.items.length : 0;
    } catch (error) {
      console.error("Cart count middleware error:", error);
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }

  next();
};

module.exports = { setUserAndCartCount };