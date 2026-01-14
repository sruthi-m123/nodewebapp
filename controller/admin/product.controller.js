import { productService } from "../../service/admin/product.service.js";
import  Category  from "../../models/categorySchema.js";
import { productSchema } from "../../utils/validation.schema.js";
import logger from "../../utils/logger.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";


const formatResponse=(success,message,data={})=>({success,message,...data});

export const renderProducts=async(req,res)=>{
  const {search="",page=1}=req.query;
  const {products,totalProducts,totalPages,skip}=await productService.getAll({search,page});

const categories= await Category.find();
res.render("admin/products",{
  layout:false,
  category:categories,
  products,
  currentPage:page,
  totalPages,
  totalProducts,
  skip,
  search
})
}

export const addProduct=async(req,res)=>{
  console.log("req body in add products",req.body);
  console.log("req.files:",req.files);
 
const{error,value}=productSchema.validate(req.body,{abortEarly:false});
if(error){
  const messages=error.details.map((err)=>err.message).join(", ");
  throw Object.assign(new Error(messages),{status:STATUS_CODES.BAD_REQUEST})
}
 const data = {
    ...value,
    price: parseFloat(value.price),
    stock: parseInt(value.stock),
    images: req.files?.map((file) => file.path) || [], 
  }
  const product=await productService.create(data)
     logger.info(`product added:${product.productName}`)              
res.status(STATUS_CODES.CREATED).json(formatResponse(true,"product added successfully",{product}))
}


export const updateProduct=async(req,res)=>{
  const{id}=req.params;
  logger.info(`update request for product Id:${id}`);

const{error,value}=productSchema.validate(req.body,{abortEarly:false});
if(error){
  const messages=error.details.map((err)=>err.message).join(", ");
  throw Object.assign(new Error(messages),{status:STATUS_CODES.BAD_REQUEST});
}

const existingProduct=await productService.findById(id);
if(!existingProduct){
  throw Object.assign(new Error("product not found"),{status:STATUS_CODES.NOT_FOUND});
}

let updatedImages=[...existingProduct.images];
console.log("removed images:",req.body.removedImages);
if(req.body.removedImages){
  const removed=JSON.parse(req.body.removedImages);
  updatedImages=updatedImages.filter((img)=>!removed.includes(img))
  for(const img of removed){
  await deleteFromCloudinary(img);
}
}

if(req.files&& req.files.length>0){
  const newImages=req.files.map((file)=>file.path);
  updatedImages=[...updatedImages,...newImages];
}

const data={
  ...value,
  price:parseFloat(value.price),
  stock:parseFloat(value.stock),
  images:updatedImages,
  isNewArrival:
   req.body.isNewArrival === "true" ||
      req.body.isNewArrival === true ||
      req.body.isNewArrival === "on",
    isActive: req.body.isActive === "true" || req.body.isActive === true,
}
const updatedProduct=await productService.update(id,data);
  logger.info(` Product updated: ${updatedProduct.productName}`);
  res
    .status(STATUS_CODES.SUCCESS)
    .json(formatResponse(true, "Product updated successfully", { product: updatedProduct }));
};

export const deleteProduct=async(req,res)=>{
  const deleted=await productService.delete(req.params.id);
  if(!deleted) throw Object.assign(new Error("product not found"),{status:STATUS_CODES.NOT_FOUND});
  logger.info(`product deleted:${deleted.productName}`);
  res.json(formatResponse(true,"product deleted successfully"));
}

export const updateProductStatus=async(req,res)=>{
  const{productId}=req.params;
  const{isActive}=req.body;

  const updated=await productService.updateProductStatus(productId,isActive);
  if(!updated ) throw Object.assign(new Error("product not found"),{status:STATUS_CODES.NOT_FOUND});

  res.json(formatResponse(true,"product details fetched",{product:updated}));
}





export const getProductDetails=async(req,res)=>{
  console.log("req.params.id:",req.params.id);
  const product=await productService.getById(req.params.id);
  if(!product) throw Object.assign(new Error("product not found"),{status:STATUS_CODES.NOT_FOUND});
  res.json(formatResponse(true,"product details obtained",{product:product}))
}


