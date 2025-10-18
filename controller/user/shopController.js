const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Offer = require("../../models/offerSchema");
const Wishlist = require('../../models/wishlistSchema');

const loadShopping = async (req, res) => {
  try {
    const filters = { isDeleted: false };
    if (req.query.availability === "In Stock") {
      filters.stock = { $gt: 0 };
    } else if (req.query.availability === "out of stock") {
      filters.stock = 0;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filters.price = {};
      if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.color && req.query.color !== "all") {
      filters.color = req.query.color;
    }
    let searchQuery = {};
    if (req.query.search) {
      searchQuery = {
        productName: { $regex: req.query.search, $options: "i" },
      };
    }

    let userData = null;
    const limit = 6;
    const page = parseInt(req.query.page) || 1;

    const totalProducts = await Product.countDocuments({ ...filters, ...searchQuery, isActive: true });
    const totalPages = Math.ceil(totalProducts / limit);
    if (req.session.user) {
      userData = await User.findById(req.session.user.id);
    }
    const categories = await Category.find({ isDeleted: false });

    let products = await Product.find({
      ...filters,
      ...searchQuery,
      isActive: true
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category")
      .populate("bestOffer")
      .lean();

    const now = new Date();
    const offers = await Offer.find({ isActive: true }).lean();

    products = products.map(product => {
      const applicableOffers = offers.filter(offer => {
        if (!offer.isActive) {
          console.log(`Offer ${offer._id} inactive`);
          return false;
        }
        if (offer.startDate && new Date(offer.startDate) > now) {
          console.log(`Offer ${offer._id} starts in future: ${offer.startDate}`);
          return false;
        }
        if (offer.endDate && new Date(offer.endDate) < now) {
          console.log(`Offer ${offer._id} expired: ${offer.endDate} < ${now}`);
          return false;
        }

        let applies = false;
        if (offer.applicableTo === 'all') applies = true;
        else if (offer.applicableTo === 'product') {
          applies = offer.applicableItems.some(id => id.toString() === product._id.toString());
        }
        else if (offer.applicableTo === 'category') {
          applies = offer.applicableItems.some(id => id.toString() === product.category._id.toString());
        }

        if (!applies) {
          console.log(`Offer ${offer._id} doesn't apply to product ${product._id} (type: ${offer.applicableTo})`);
        }

        return applies;
      });

      console.log(`Product ${product.productName} (${product._id}): Applicable offers count: ${applicableOffers.length}`);
      console.log("Applicable offers details:", applicableOffers.map(o => ({ id: o._id, type: o.type, value: o.discountValue, min: o.minOrderValue || 0 })));

      let bestOffer = { discount: 0 };
      if (applicableOffers.length > 0) {
        const productPrice = product.price;
        bestOffer = applicableOffers.reduce((max, offer) => {
          let discount = 0;
          if (offer.type === 'percentage') {
            discount = (productPrice * offer.discountValue) / 100;
            if (offer.maxDiscount) {
              discount = Math.min(discount, offer.maxDiscount);
            }
          } else if (offer.type === 'fixed') {
            discount = offer.discountValue;
          }
          if (productPrice < (offer.minOrderValue || 0)) {
            console.log(`Offer ${offer._id} invalid: price ${productPrice} < min ${offer.minOrderValue}`);
            discount = 0;
          }
          console.log(`Offer ${offer._id} discount calc: ${discount}`);
          return discount > max.discount ? { ...offer, discount } : max;
        }, { discount: 0 });
      } else {
        console.log(`No applicable offers for product ${product._id}`);
      }

      // Fallback to populated static bestOffer if dynamic is 0
      if (bestOffer.discount === 0 && product.bestOffer && product.bestOffer.discountValue > 0) {
        let staticDiscount = 0;
        const staticOffer = product.bestOffer;
        const productPrice = product.price;
        if (staticOffer.type === 'percentage') {
          staticDiscount = (productPrice * staticOffer.discountValue) / 100;
        } else if (staticOffer.type === 'fixed') {
          staticDiscount = staticOffer.discountValue;
        }
        if (productPrice >= (staticOffer.minOrderValue || 0)) {
          bestOffer = { ...staticOffer, discount: staticDiscount };
          console.log(`Fallback to static bestOffer for ${product.productName}: ${staticDiscount}`);
        }
      }

      if (bestOffer.discount > 0) {
        console.log(`Final bestOffer for ${product.productName}:`, bestOffer);
      } else {
        product.bestOffer = null;
        product.discountedPrice = null;
        console.log(`No valid discount for ${product.productName} (stays {discount:0})`);
      }

      if (bestOffer) product.bestOffer = bestOffer;
      console.log("product bestoffer:", product.bestOffer);
      return product;
    });

    let wishlist = [];
    if (req.session.user) {
      const userWishlist = await Wishlist.findOne({ userId: req.session.user._id });
      console.log("userwishlistitems:", userWishlist);
      if (userWishlist) {
        wishlist = userWishlist.items.map(item => item.productId.toString());
      }
    }

    return res.render("user/shopall", {
      pageCSS: "user/shopall.css",
      pageJS: "user/shopall.js",
      pageTitle: 'Chettinad - Premium Saree Boutique',
      user: userData,
      currentPath: req.path,
      products,
      wishlist,
      categories,
      isProductDetail: false,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.log("shopping page not loading:", error);
    res.status(500).send("server error");
  }
};

const applyFilters = async (req, res) => {
  try {
    const { search, sort, categories, availability, colors, minPrice, maxPrice, page = 1, limit = 12 } = req.body;  // Added pagination support
    let query = {};

    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    if (availability && availability.length > 0) {
      if (availability.includes('in-stock') && !availability.includes('out-stock')) {
        query.stock = { $gt: 0 };
      } else if (!availability.includes('in-stock') && availability.includes('out-stock')) {
        query.stock = { $lte: 0 };
      }
    }

    if (colors && colors.length > 0) {
      query.color = { $in: colors };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== "") {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== "") {
        query.price.$lte = Number(maxPrice);
      }
    }

    query.isActive = true;
    query.isDeleted = false;
    console.log("all the queries:", query);

    const total = await Product.countDocuments(query);  // For counts

    let productsQuery = Product.find(query)
      .populate("category")
      .populate("bestOffer")
      .skip((page - 1) * limit)
      .limit(limit);

    switch (sort) {
      case 'price-asc':
        productsQuery = productsQuery.sort({ price: 1 });
        break;
      case 'price-desc':
        productsQuery = productsQuery.sort({ price: -1 });
        break;
      case 'name-asc':
        productsQuery = productsQuery.sort({ productName: 1 });
        break;
      case 'name-desc':
        productsQuery = productsQuery.sort({ productName: -1 });
        break;
      default:
        productsQuery = productsQuery.sort({ createdAt: -1 });  // Fixed default
        break;
    }

    console.log('Received minPrice:', minPrice, 'maxPrice:', maxPrice);

    let products = await productsQuery.lean();

    const now = new Date();
    const offers = await Offer.find({ isActive: true }).lean();

    products = products.map(product => {
      // Copy the entire offer mapping logic from loadShopping (same as above)
      const applicableOffers = offers.filter(offer => {
        if (!offer.isActive) return false;
        if (offer.startDate && new Date(offer.startDate) > now) return false;
        if (offer.endDate && new Date(offer.endDate) < now) return false;

        let applies = false;
        if (offer.applicableTo === 'all') applies = true;
        else if (offer.applicableTo === 'product') {
          applies = offer.applicableItems.some(id => id.toString() === product._id.toString());
        } else if (offer.applicableTo === 'category') {
          applies = offer.applicableItems.some(id => id.toString() === product.category._id.toString());
        }
        return applies;
      });

      let bestOffer = { discount: 0 };
      if (applicableOffers.length > 0) {
        const productPrice = product.price;
        bestOffer = applicableOffers.reduce((max, offer) => {
          let discount = 0;
          if (offer.type === 'percentage') {
            discount = (productPrice * offer.discountValue) / 100;
            if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
          } else if (offer.type === 'fixed') {
            discount = offer.discountValue;
          }
          if (productPrice < (offer.minOrderValue || 0)) discount = 0;
          return discount > max.discount ? { ...offer, discount } : max;
        }, { discount: 0 });
      }

      if (bestOffer.discount === 0 && product.bestOffer && product.bestOffer.discountValue > 0) {
        let staticDiscount = 0;
        const staticOffer = product.bestOffer;
        const productPrice = product.price;
        if (staticOffer.type === 'percentage') {
          staticDiscount = (productPrice * staticOffer.discountValue) / 100;
        } else if (staticOffer.type === 'fixed') {
          staticDiscount = staticOffer.discountValue;
        }
        if (productPrice >= (staticOffer.minOrderValue || 0)) {
          bestOffer = { ...staticOffer, discount: staticDiscount };
        }
      }

      if (bestOffer.discount > 0) {
        product.bestOffer = bestOffer;
      } else {
        product.bestOffer = null;
        product.discountedPrice = null;
      }
      return product;
    });

    let wishlist = [];
    if (req.session.user) {
      const userWishlist = await Wishlist.findOne({ userId: req.session.user._id });
      if (userWishlist) {
        wishlist = userWishlist.items.map(item => item.productId.toString());
      }
    }

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ 
      products, 
      total, 
      totalPages, 
      currentPage: page,
      wishlist 
    });

  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ message: 'Filtering failed' });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const products = await Product.find({ category: categoryId, isDeleted: false, isActive: true });
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Category filter failed' });
  }
};

// New: For /user/shopall/all (JSON all products)
const loadAllProducts = async (req, res) => {
  try {
    let query = { isActive: true, isDeleted: false };

    let products = await Product.find(query)
      .populate("category")
      .populate("bestOffer")
      .lean();

    const now = new Date();
    const offers = await Offer.find({ isActive: true }).lean();

    products = products.map(product => {
      // Same offer mapping as above (copy from loadShopping/applyFilters)
      const applicableOffers = offers.filter(offer => {
        if (!offer.isActive) return false;
        if (offer.startDate && new Date(offer.startDate) > now) return false;
        if (offer.endDate && new Date(offer.endDate) < now) return false;

        let applies = false;
        if (offer.applicableTo === 'all') applies = true;
        else if (offer.applicableTo === 'product') {
          applies = offer.applicableItems.some(id => id.toString() === product._id.toString());
        } else if (offer.applicableTo === 'category') {
          applies = offer.applicableItems.some(id => id.toString() === product.category._id.toString());
        }
        return applies;
      });

      let bestOffer = { discount: 0 };
      if (applicableOffers.length > 0) {
        const productPrice = product.price;
        bestOffer = applicableOffers.reduce((max, offer) => {
          let discount = 0;
          if (offer.type === 'percentage') {
            discount = (productPrice * offer.discountValue) / 100;
            if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
          } else if (offer.type === 'fixed') {
            discount = offer.discountValue;
          }
          if (productPrice < (offer.minOrderValue || 0)) discount = 0;
          return discount > max.discount ? { ...offer, discount } : max;
        }, { discount: 0 });
      }

      if (bestOffer.discount === 0 && product.bestOffer && product.bestOffer.discountValue > 0) {
        let staticDiscount = 0;
        const staticOffer = product.bestOffer;
        const productPrice = product.price;
        if (staticOffer.type === 'percentage') {
          staticDiscount = (productPrice * staticOffer.discountValue) / 100;
        } else if (staticOffer.type === 'fixed') {
          staticDiscount = staticOffer.discountValue;
        }
        if (productPrice >= (staticOffer.minOrderValue || 0)) {
          bestOffer = { ...staticOffer, discount: staticDiscount };
        }
      }

      if (bestOffer.discount > 0) {
        product.bestOffer = bestOffer;
      } else {
        product.bestOffer = null;
        product.discountedPrice = null;
      }
      return product;
    });

    let wishlist = [];
    if (req.session.user) {
      const userWishlist = await Wishlist.findOne({ userId: req.session.user._id });
      if (userWishlist) {
        wishlist = userWishlist.items.map(item => item.productId.toString());
      }
    }

    res.status(200).json({ products, wishlist });
  } catch (error) {
    console.error("Error loading all products:", error);
    res.status(500).json({ message: 'Failed to load products' });
  }
};

module.exports = {
  applyFilters,
  loadShopping,
  getProductsByCategory,
  loadAllProducts
};