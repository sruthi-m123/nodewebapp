import ShopService from "../../service/user/shop.service.js";
  import {STATUS_CODES} from '../../utils/statusCodes.js';
  import { MESSAGES } from "../../utils/messages.js";
  import logger from '../../utils/logger.js';

  export const loadShoppping =async(req,res)=>{
    logger.info('loading shopping page');

    const{
      availability,
      minPrice,
      maxPrice,
      color,
      search,
      page,
      limit
    }=req.query;

    const filters={isDeleted:false};

<<<<<<< Updated upstream
    if(availability==='Instock'){
      filters.stock={$gt:0};
    }else if(availability==="out of stock"){
      filters.stock=0;
=======
const loadShopping = async (req, res) => {
  try {
    const isAjaxRequest = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    const filters = { isDeleted: false }; 
    //availability
    if (req.query.availability === "In Stock") {
      filters.stock = { $gt: 0 };
    } else if (req.query.availability === "out of stock") {
      filters.stock = 0;
>>>>>>> Stashed changes
    }

    if(minPrice||maxPrice){
      filters.price={};
      if(minPrice) filters.price.$gte=Number(minPrice);
      if(maxPrice) filters.price.$lte=Number(maxPrice);
    }
<<<<<<< Updated upstream
    if(color && color!=="all"){
      filters.color=color;
    }
    const searchQuery=search?{productName:{$regex:search,$options:"i"}}:{};
    const userData=req.session.user
    ?await ShopService.getUserData(req.session.user.id)
    :null;

    const categories=await ShopService.getCategories();
    const {
=======
    // color
    if (req.query.color && req.query.color !== "all") {
      filters.color = req.query.color;
    }
    //search
    let searchQuery = {};
    if (req.query.search) {
      console.log("hii search here")
      searchQuery = {
        productName: { $regex: req.query.search, $options: "i" },
      };
    }
    
    let userData = null;
    const limit=6;
    const page=parseInt(req.query.page)||1;
    
    const totalProducts=await Product.countDocuments();
    const totalPages=Math.ceil(totalProducts/limit);
    if (req.session.user) {
          console.log("userId iside the shopall page",req.session.user.id);
      userData = await User.findById(req.session.user.id);
    }
    const categories = await Category.find({ isDeleted: false });


    const products = await Product.find({
      ...filters,
      ...searchQuery,
    })
    .skip((page-1)*limit)
    .limit(limit)
    .populate("category");

 if (isAjaxRequest) {
      return res.json({
        products: products,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalProducts: totalProducts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
      console.log('📄 Returning HTML response');
    }


    return res.render("user/shopall", {

      pageCSS: "user/shopall.css",
      pageJS:"user/shopall.js",
       pageTitle: 'Chettinad - Premium Saree Boutique',
        user: userData,
         currentPath: req.path,
>>>>>>> Stashed changes
      products,
      totalPages,
      currentPage,

    }=await ShopService.getProductsWithFilters({
      query:filters,
      searchQuery,
      page,
      limit
    });

    const wishlist=await ShopService.getUserWishlist(req.session.user?.id);
    res.render("user/shopall",{
      pageCSS:"user/shopall.css",
      pageJS:"user/shopall.js",
      pageTitle:"Chettinad - Premium Saree Botique",
      user:userData,
      currentPath:req.path,
      products,
      wishlist,
      categories,
      isProductDetail:false,
      totalPages,
      currentPage,
      message:MESSAGES.SHOP.PRODUCTS_FETCH_SUCCESS
    });
<<<<<<< Updated upstream
=======
  } catch (error) {
    console.log("shopping page not loading:", error);
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ error: "Server error" });
    }

    res.status(500).send("server error");
>>>>>>> Stashed changes
  }

 export const applyFilters = async (req, res) => {
    logger.info("Applying product filters");

    const filters=req.body;
    const query=ShopService.buildProductQuery(filters);
    const {sort,direction}=ShopService.getSortOptions(filters.sort);
  
  const {
    products,
    total,
    totalPages,
    currentPage
  } = await ShopService.getProductsWithFilters({
    query,
    page: filters.page,
    limit: filters.limit,
    sort,
    direction
  });
  const wishlist = await ShopService.getUserWishlist(req.session.user?._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:MESSAGES.SHOP.FILTERS_APPLIED_SUCCESS,
    products,
    total,
    totalPages,
    currentPage,
    wishlist
  });
};

export const getProductsByCategory = async (req, res) => {
  logger.info("Getting products by category");

 
  const { id } = req.params;

  const { products, totalProducts } =
    await ShopService.getProductsByCategory(id);

<<<<<<< Updated upstream
  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:MESSAGES.SHOP.CATEGORY_PRODUCTS_SUCCESS,
    products,
    total: totalProducts
  });
=======
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
>>>>>>> Stashed changes
}
export const loadAllProducts = async (req, res) => {
  logger.info("Loading all products");

  const products = await ShopService.getAllProducts();
  const wishlist = await ShopService.getUserWishlist(req.session.user?._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:MESSAGES.SHOP.PRODUCTS_FETCH_SUCCESS,
    products,
    wishlist
  });
}