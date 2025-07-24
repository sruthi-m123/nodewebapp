const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");




const loadShopping = async (req, res) => {
  try {
    const filters = { isDeleted: false }; //base filter
    //availability
    if (req.query.availability === "In Stock") {
      filters.stock = { $gt: 0 };
    } else if (req.query.availability === "out of stock") {
      filters.stock = 0;
    }

    //price range
    if (req.query.price === "0-1000") {
      filters.price = { $lte: 100 };
    } else if (req.query.price === "1000-3000") {
      filters.price = { $gt: 1000, $lte: 3000 };
    } else if (req.query.price === "3000+") {
      filters.price = { $gt: 3000 };
    }
    // color
    if (req.query.color && req.query.color !== "all") {
      filters.color = req.query.color;
    }
    //search
    let searchQuery = {};
    if (req.query.search) {
      searchQuery = {
        productName: { $regex: req.query.search, $options: "i" },
      };
    }

    //combining all the filters and search
    let userData = null;
    if (req.session.user) {
      userData = await User.findById(req.session.user._id);
    }
    const categories = await Category.find({ isDeleted: false });
    const products = await Product.find({
      ...filters,
      ...searchQuery,
    }).populate("category");
    return res.render("user/shopall", {

      pageCSS: "user/shopall.css",
      pageJS:"user/shopall.js",
       pageTitle: 'Chettinad - Premium Saree Boutique',
        user: userData,
         currentPath: req.path,
      products,
      categories,
      isProductDetail: false
    });
  } catch (error) {
    console.log("shopping page not loading:", error);
    res.status(500).send("server error");
  }
};

const applyFilters = async (req, res) => {
  try {
    const { search, sort, categories, availability, colors, minPrice, maxPrice } = req.body;
    let query = {};

    //  Search by product name
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    //  Categories
    if (categories && categories.length > 0) {
      query.category = { $in: categories }; 
    }

    // 📦 Availability
    if (availability && availability.length > 0) {
      if (
        availability.includes('in-stock') &&
        !availability.includes('out-stock')
      ) {
        query.stock = { $gt: 0 }; // In-stock
      } else if (
        !availability.includes('in-stock') &&
        availability.includes('out-stock')
      ) {
        query.stock = { $lte: 0 }; // Out-of-stock
      }
      // If both are selected, don't filter by stock
    }

    //  Color Filter
    if (colors && colors.length > 0) {
      query.color = { $in: colors };
    }

    //  Price Range
    if (minPrice !== undefined || maxPrice !== undefined) {
  query.price = {};
  if (minPrice !== undefined && minPrice !== "") {
    query.price.$gte = Number(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    query.price.$lte = Number(maxPrice);
  }
}


    //  Only fetch active products
    query.isActive = true;
    query.isDeleted=false;
console.log("all the queries:",query)
    //  Build the query
    let productsQuery = Product.find(query);
    

    //  Sorting
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
    productsQuery = productsQuery.sort({ createdAt: -1 });
    break;
    }
console.log(' Received minPrice:', minPrice, 'maxPrice:', maxPrice);

    const filteredProducts = await productsQuery.exec();
   console.log("filtered products",filteredProducts)
    res.status(200).json({ products: filteredProducts });

  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ message: 'Filtering failed' });
  }
};
const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const products = await Product.find({ category: categoryId,isDeleted:false,isActive:true });
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Category filter failed' });
  }
};

module.exports={
    applyFilters,
    loadShopping,
    getProductsByCategory
}