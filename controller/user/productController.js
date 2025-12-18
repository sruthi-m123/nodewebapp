import * as productService from '../../service/user/product.service.js';
import { getProductDetailSchema } from '../../utils/validation.schema.js';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';


export const productDetail=async(req,res)=>{
  const productId=req.params.id;
  logger.info('loading product details page',{productId});

  const {error}=getProductDetailSchema.validate({id:productId});
  if(error){
    logger.warn('product detail validation failed',{error:error.details[0].message});
    const validationError=new Error(error.details[0].message);
    validationError.statusCode=STATUS_CODES.BAD_REQUEST;
    throw validationError;
  }

const product=await productService.getProductDetailService(productId);
const relatedProducts=await productService.getRelatedProductsService(
  productId,
  product.category
);
const availablity=productService.checkProductAvailabilityService(product);

res.render('user/productDetails',{
  product,
  relatedProducts,
   pageCSS: "productdetails.css",
        pageJS: "user/productdetails.js",
        pageTitle: `${product.productName} - Product Detail`,
        isProductDetail: true,
        isOutOfStock: availablity.isOutOfStock,
        isLowStock: availablity.isLowStock,
        stockMessage: availablity.stockMessage
})
};