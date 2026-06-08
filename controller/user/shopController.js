import ShopService from "../../service/user/shop.service.js";
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from "../../utils/messages.js";
import logger from '../../utils/logger.js';
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import User from "../../models/userSchema.js";

export const loadShopping = async (req, res) => {
  logger.info('loading shopping page');
  
  try {
    const isAjaxRequest = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    const {
      availability,
      minPrice,
      maxPrice,
      color,
      search,
      page,
      limit
    } = req.query;

    const filters = { isDeleted: false };

    // Availability filter
    if (availability === 'In Stock' || availability === 'Instock') {
      filters.stock = { $gt: 0 };
    } else if (availability === "out of stock") {
      filters.stock = 0;
    }

    // Price filter
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    // Color filter
    if (color && color !== "all") {
      filters.color = color;
    }

    // Search filter
    const searchQuery = search ? { productName: { $regex: search, $options: "i" } } : {};

    // Get user data
    const userData = req.session.user ? await ShopService.getUserData(req.session.user.id) : null;
    const categories = await ShopService.getCategories();

    const itemsPerPage = limit ? parseInt(limit) : 6;
    const currentPage = page ? parseInt(page) : 1;

    const { products, totalPages, currentPage: pageResult } = await ShopService.getProductsWithFilters({
      query: filters,
      searchQuery,
      page: currentPage,
      limit: itemsPerPage
    });

    const wishlist = await ShopService.getUserWishlist(req.session.user?.id);

    if (isAjaxRequest) {
      return res.json({
        products,
        pagination: {
          currentPage: pageResult,
          totalPages,
          totalProducts: products.length,
          hasNextPage: pageResult < totalPages,
          hasPrevPage: pageResult > 1
        }
      });
    }

    res.render("user/shopall", {
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
      currentPage: pageResult,
      message: MESSAGES.SHOP?.PRODUCTS_FETCH_SUCCESS || "Products loaded successfully"
    });
  } catch (error) {
    logger.error("shopping page not loading:", error);
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ error: "Server error" });
    }
    res.status(500).send("server error");
  }
};

export const applyFilters = async (req, res) => {
  logger.info("Applying product filters");
  
  try {
    const filters = req.body;
    const query = ShopService.buildProductQuery(filters);
    const { sort, direction } = ShopService.getSortOptions(filters.sort);

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
    
    const wishlist = await ShopService.getUserWishlist(req.session.user?.id);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: MESSAGES.SHOP?.FILTERS_APPLIED_SUCCESS || "Filters applied",
      products,
      total,
      totalPages,
      currentPage,
      wishlist
    });
  } catch (error) {
    logger.error("Error applying filters:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProductsByCategory = async (req, res) => {
  logger.info("Getting products by category");
  
  try {
    const { id } = req.params;
    const { products, totalProducts } = await ShopService.getProductsByCategory(id);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: MESSAGES.SHOP?.CATEGORY_PRODUCTS_SUCCESS || "Category products loaded",
      products,
      total: totalProducts
    });
  } catch (error) {
    logger.error("Error getting products by category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loadAllProducts = async (req, res) => {
  logger.info("Loading all products");
  
  try {
    const products = await ShopService.getAllProducts();
    const wishlist = await ShopService.getUserWishlist(req.session.user?.id);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: MESSAGES.SHOP?.PRODUCTS_FETCH_SUCCESS || "Products loaded",
      products,
      wishlist
    });
  } catch (error) {
    logger.error("Error loading all products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};