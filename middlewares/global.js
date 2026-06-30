import Cart from "../models/cartSchema.js";
import Wishlist from "../models/wishlistSchema.js";

//  export const setUserAndCartCount = async (req, res, next) => {
//   res.locals.user = req.session.user || null;
//   res.locals.currentPath = req.path;

//   if (req.session.user) {
//     try {
//       const cart = await Cart.findOne({ userId: req.session.user.id });
//       res.locals.cartCount = cart ? cart.items.length : 0;
//     } catch (error) {
//       console.error("Cart count middleware error:", error);
//       res.locals.cartCount = 0;
//     }
//   } else {
//     res.locals.cartCount = 0;
//   }

//   next();
// };

export const setUserAndCartCount = async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;

  if (req.session.user) {
    try {
      const [cart, wishlist] = await Promise.all([
        Cart.findOne({ userId: req.session.user.id }),
        Wishlist.findOne({ user: req.session.user.id })
      ]);

      res.locals.cartCount = cart ? cart.items.length : 0;
      res.locals.wishlistCount = wishlist ? wishlist.items.length : 0;
    } catch (error) {
      console.error("Count middleware error:", error);
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;
  }

  next();
};

