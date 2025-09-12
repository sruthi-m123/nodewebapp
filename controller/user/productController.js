const Product = require("../../models/productSchema");
const productDetail=async(req,res)=>{
  try {
    const productId=req.params.id;
    const product=await Product.findById(productId).populate('bestOffer');
    console.log("product in product detail page :",product);
    if(!product||product.isDeleted||!product.isActive){
      return res.status(404).render('404');
    }
const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: productId },
      isActive: true,
      isDeleted: false
    }).limit(4);


    res.render('user/productDetails',{product,
      relatedProducts,
      pageCSS:"productdetails.css",
      isOutofStock:product.stock<=0,
pageJS:"user/productdetails.js",
pageTitle:"Product Detail",
isProductDetail: true
    })
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).render('500'); 
  }
}
module.exports={productDetail};
