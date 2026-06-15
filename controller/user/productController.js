import * as productService from '../../service/user/product.service.js';
import logger from '../../utils/logger.js';

export const productDetail = async (req, res) => {
  const productId = req.params.id;
  logger.info('Loading product details page', { productId });

  const product = await productService.getProductDetailService(productId);
  const relatedProducts = await productService.getRelatedProductsService(
    productId,
    product.category
  );
  const availability = productService.checkProductAvailabilityService(product);
let limit=5
  res.render('user/productDetails', {
    product,
    limit,
    relatedProducts,
    pageCSS: 'productdetails.css',
    pageJS: 'user/productdetails.js',
    pageTitle: `${product.productName} - Product Detail`,
    isProductDetail: true,
    isOutOfStock: availability.isOutOfStock,
    isLowStock: availability.isLowStock,
    stockMessage: availability.stockMessage
  });
};