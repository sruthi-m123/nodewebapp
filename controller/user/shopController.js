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

    if(availability==='Instock'){
      filters.stock={$gt:0};
    }else if(availability==="out of stock"){
      filters.stock=0;
    }

    if(minPrice||maxPrice){
      filters.price={};
      if(minPrice) filters.price.$gte=Number(minPrice);
      if(maxPrice) filters.price.$lte=Number(maxPrice);
    }
    if(color && color!=="all"){
      filters.color=color;
    }
    const searchQuery=search?{productName:{$regex:search,$options:"i"}}:{};
    const userData=req.session.user
    ?await ShopService.getUserData(req.session.user.id)
    :null;

    const categories=await ShopService.getCategories();
    const {
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

  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:MESSAGES.SHOP.CATEGORY_PRODUCTS_SUCCESS,
    products,
    total: totalProducts
  });
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