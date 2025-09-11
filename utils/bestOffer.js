const Product = require('../models/productSchema');
const Offer = require('../models/offerSchema');


function calculateBestOffer(product, offers) {
  if (!offers || offers.length === 0) return null;

  let bestOffer = null;
  let maxDiscount = 0;
  let discountedPrice=0;
  const productPrice = product.price;

  for (const offer of offers) {
    let discount = 0;

    if (offer.type === "percentage") {
      discount = (productPrice * offer.discountValue) / 100;

      if (offer.maxDiscount) {
        discount = Math.min(discount, offer.maxDiscount);
      }
    } else if (offer.type === "flat") {
      discount = offer.discountValue;
    }

    if (productPrice < offer.minOrderValue) {
      discount = 0;
    }

    if (discount > maxDiscount) {
      maxDiscount = discount;
    //   bestOffer = {
    //     offerId: offer._id,
    //     title: offer.title,
    //     code: offer.code,
    //     type: offer.type,
    //     discountValue: offer.discountValue,
    //     minOrderValue: offer.minOrderValue,
    //     maxDiscount: offer.maxDiscount,
    //     discountedPrice: productPrice - discount,
    //     discount
    //   };
discountedPrice=productPrice-discount;
    bestOffer=offer._id;
    }
  }

  return {bestOffer,discount:maxDiscount,discountedPrice};
}

const updateProductsOffer = async (offer) => {
    try{
  let filter = {};
  if (offer.applicableTo === "all") {
    filter = { isActive: true, isDeleted: false };
  } else if (offer.applicableTo === "product") {
    filter = { _id: { $in: offer.applicableItems }, isActive: true, isDeleted: false };
  } else if (offer.applicableTo === "category") {
    filter = { category: { $in: offer.applicableItems }, isActive: true, isDeleted: false };
  }

  const products = await Product.find(filter);

   for (const product of products) {
      const best = calculateBestOffer(product, activeOffers);
      product.bestOffer = best.bestOffer;
      product.discount = best.discount;
      product.discountedPrice = best.discountedPrice;
    }

     await Promise.all(products.map(p => p.save()));

    console.log(`Updated ${products.length} products with best offer`);
}catch(err){
    console.error("error updating products:",err);
};
}

module.exports = { updateProductsOffer, calculateBestOffer };
