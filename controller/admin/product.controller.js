// controllers/admin/product.controller.js
import { productService } from "../../service/admin/product.service.js";
import Category from "../../models/categorySchema.js";
import logger from "../../utils/logger.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";
import Product from '../../models/productSchema.js';

const formatResponse = (success, message, data = {}) => ({ success, message, ...data });

export const renderProducts = async (req, res) => {
  const { search = "", page = 1 } = req.query;
  const { products, totalProducts, totalPages, skip } = await productService.getAll({ search, page });


  const categories = await Category.find();
  res.render("admin/products", {
    layout: false,
    category: categories,
    products,
    currentPage: page,
    totalPages,
    totalProducts,
    skip,
    search
    
  });
};

export const addProduct = async (req, res) => {
  const { price, stock, sku,...otherData } = req.validatedData; // Destructure from validated body

  const data = {
    ...otherData,
    sku,
    price: parseFloat(price),
    stock: parseInt(stock),
    images: req.files?.map((file) => file.path) || [],
  };

 const result=await productService.create(data);
 console.log("result.product:",result.product);
 if(result.type==="RESTORED"){
  logger.info(`product restored:${result.product.productName}`);
  return res
  .status(STATUS_CODES.SUCCESS)
  .json(formatResponse(true,"product restored successfully",{product:result.product}));
 }
 logger.info(`product added:${result.product.productName}`);
 return res
 .status(STATUS_CODES.CREATED)
 .json(formatResponse(true,"product added successfully",{product:result.product}))
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  logger.info(`update request for product Id: ${id}`);
console.log("validated data:",req.validatedData.removedImages);
console.log("type of rmoved images:",typeof(req.validatedData.removedImages))
  const { price, stock, removedImages: removedImagesStr, isNewArrival, isActive, ...otherData } = req.validatedData; 
  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    throw Object.assign(new Error("product not found"), { status: STATUS_CODES.NOT_FOUND });
  }
console.log("existing Image Products:",existingProduct.images);
  let updatedImages = [...existingProduct.images];
  console.log("removedImagesStr:",removedImagesStr);
  if (removedImagesStr) {
    const removed = JSON.parse(removedImagesStr); 
    updatedImages = updatedImages.filter((img) => !removed.includes(img));
    for (const img of removed) {
      await deleteFromCloudinary(img);
    }
  }
console.log("updated images:",updatedImages);
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => file.path);
    console.log("newImages",newImages);
    updatedImages = [...updatedImages, ...newImages];
    console.log("updated Images after spread:",updatedImages);
  }

  const data = {
    ...otherData,
    price: parseFloat(price),
    stock: parseInt(stock), 
    images: updatedImages,
    isNewArrival: isNewArrival === "true" || isNewArrival === true || isNewArrival === "on",
    isActive: isActive === "true" || isActive === true,
  };

  const updatedProduct = await productService.update(id, data);
  logger.info(`Product updated: ${updatedProduct.productName}`);
  res
    .status(STATUS_CODES.SUCCESS)
    .json(formatResponse(true, "Product updated successfully", { product: updatedProduct }));
};

export const deleteProduct = async (req, res) => {
  const deleted = await productService.delete(req.params.id);
  if(!deleted){
    return res.status(400).json({success:false,message:'Something went wrong '})
  }
  logger.info(`product deleted: ${deleted.productName}`);
  res.json(formatResponse(true, "product deleted successfully"));
};

export const updateProductStatus = async (req, res) => {
  const { productId } = req.params;
  const { isActive } = req.validatedData; 

  const updated = await productService.updateProductStatus(productId, isActive);
  if (!updated) throw Object.assign(new Error("product not found"), { status: STATUS_CODES.NOT_FOUND });

  res.json(formatResponse(true, "product status updated successfully", { product: updated })); // Fixed message
};

export const getProductDetails = async (req, res) => {
  const product = await productService.getById(req.params.id);
  console.log("product",product);
  if (!product) throw Object.assign(new Error("product not found"), { status: STATUS_CODES.NOT_FOUND });
  res.json(formatResponse(true, "product details obtained", { product }));
};