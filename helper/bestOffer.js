import Product from "../models/productSchema.js";
import Offer from "../models/offerSchema.js";

function calculateBestOffer(product, offers) {
  if (!offers || offers.length === 0) return null;

  let bestOffer = null;
  let maxDiscount = 0;
  let discountedPrice = 0;

  const productPrice = product.price;

  for (const offer of offers) {
    let discount = 0;

    if (offer.type === "percentage") {
      discount = (productPrice * offer.discountValue) / 100;

      if (offer.maxDiscount) {
        discount = Math.min(discount, offer.maxDiscount);
      }
    } else if (offer.type === "fixed") {
      discount = offer.discountValue;
    }

    if (productPrice < offer.minOrderValue) {
      discount = 0;
    }

    if (discount > maxDiscount) {
      maxDiscount = discount;
      discountedPrice = productPrice - discount;
      bestOffer = offer._id;
    }
  }

  return {
    bestOffer,
    discount: maxDiscount,
    discountedPrice,
  };
}

export const updateProductsOffer = async (offer) => {
  try {
    let filter = {};

    if (offer.applicableTo === "all") {
      filter = { isActive: true, isDeleted: false };
    } else if (offer.applicableTo === "product") {
      filter = {
        _id: { $in: offer.applicableItems },
        isActive: true,
        isDeleted: false,
      };
    } else if (offer.applicableTo === "category") {
      filter = {
        category: { $in: offer.applicableItems },
        isActive: true,
        isDeleted: false,
      };
    }

    const activeOffers = await Offer.find({ isActive: true,endDate:{$gte:new Date()} });
    const products = await Product.find(filter);

    for (const product of products) {
      const best = calculateBestOffer(product, activeOffers);
      console.log("best inside the offer:",best);

      product.bestOffer = best?.bestOffer || null;
      console.log("best offer inside the product:",product.bestOffer);
      product.discount = best?.discount || 0;
      // Only set a discountedPrice when there is a real discount; 0 means "no offer applied"
      product.discountedPrice = (best && best.discount > 0) ? best.discountedPrice : 0;
    }

    await Promise.all(products.map((p) => p.save()));

    console.log(`Updated ${products.length} products with best offer`);
  } catch (err) {
    console.error("Error updating products:", err);
  }
};

export { calculateBestOffer };
