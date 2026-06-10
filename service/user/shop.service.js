import Category from '../../models/categorySchema.js';
import Product from '../../models/productSchema.js';
import User from '../../models/userSchema.js';
import Offer from '../../models/offerSchema.js';
import Wishlist from '../../models/wishlistSchema.js';
import logger from '../../utils/logger.js';
import Cart from '../../models/cartSchema.js';

class ShopService {

static async removeAllProductsService(userId){
    const result=await Cart.updateOne({userId},{$set:{items:[]}});
    return result;
}



  static async getCategories() {
    logger.debug('fetching categories');

    const categories = await Category.find({ isDeleted: false }).sort({ name: 1 });

    logger.info('categories fetched successfully', { count: categories.length });

    return categories;
  }

  static async getProductsWithFilters(filters = {}) {
    const {
      query = {},
      search = "",
      page = 1,
      limit = 6,
      sort = "createdAt",
      direction = -1
    } = filters;

    logger.debug("fetching products with filters", { query, page, limit });

    let searchQuery = {};

    if (search) {
      searchQuery = {
        $or: [
          { productName: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ]
      };
    }

    const totalProducts = await Product.countDocuments({
      ...query,
      ...searchQuery,
      isActive: true
    });

    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;

    let productsQuery = Product.find({
      ...query,
      ...searchQuery,
      isActive: true
    })
      .skip(skip)
      .limit(limit)
      .populate("category")
      .populate("bestOffer");

    if (sort && direction) {
      productsQuery = productsQuery.sort({ [sort]: direction });
    }

    let products = await productsQuery.lean();

    
    products = await this.applyOffersToProducts(products);

    logger.info("Products fetched successfully", {
      count: products.length,
      totalProducts,
      totalPages,
      page
    });

    return {
      products,
      totalProducts,
      totalPages,
      currentPage: page
    };
  }

static async getUserWishlist(userId){
if(!userId){
    logger.debug('No user Id provided for wishlist');
    return [];
}

logger.debug ('Fetching user wishlist',{userId});

const userWishlist=await Wishlist.findOne({userId});
const wishlist=userWishlist
?userWishlist.items.map(item=>item.productId.toString()):[];
logger.debug('User wishlist fetched',{userId,count:wishlist.lenght});
return wishlist;
}

static async getUserData(userId){
    if(!userId){
        logger.debug('No userId provided for user data');
        return null;
    }
    logger.debug('fetching user data',{userId});
    const user=await User.findById(userId);
    logger.debug('User data fetched ',{userId,exists:!!user});
    return user;
}

static async applyOffersToProducts(products){
    if(!products||products.length===0){
        return products;
    }
    logger.debug('Applying offers to products',{productCount:products.length});
    const now=new Date();
    const offers=await Offer.find({isActive:true}).lean();
    const processedProducts=products.map(product=>{
        const applicableOffers=this.findApplicableOffers(offers,product,now);
        const bestOffer=this.calculateBestOffer(applicableOffers,product);
        console.log("bestOffer inside appyoffertoproducts:",bestOffer);

        if(bestOffer.discount>0){
            product.bestOffer=bestOffer._id;
            product.discountedPrice=product.price-bestOffer.discount;
        }else{
            product.bestOffer=null;
            product.discountedPrice=product.price;
        }
        return product;
    });
    logger.debug('Offers applied to products');
    return processedProducts;
}

static findApplicableOffers(offers,product,now){
    return offers.filter(offer=>{
        if(!offer.isActive)return false;
        if(offer.startDate&&new Date(offer.startDate)>now) return false;
        if(offer.endDate&& new Date(offer.endDate)<now) return false;

        let applies=false;
        if(offer.applicableTo==='all') applies=true;
        else if(offer.applicableTo==='product'){
            applies=offer.applicableItems?.some(id=>
                id.toString()===product._id.toString()
            )|| false;
        }else if(offer.applicableTo==='category'){
            applies=offer.applicableItems?.some(id=>
                id.toString()===product.category?._id?.toString()
            )||false;
        }
        return applies
    })
}

static calculateBestOffer(applicableOffers,product){
    if(applicableOffers.length===0){
        return {discount:0};
    }

    const productPrice=product.price;
    return applicableOffers.reduce((max,offer)=>{
        let discount=this.calculateDiscount(offer,productPrice);

        if(productPrice<(offer.minOrderValue||0)){
            discount=0;
        }
        return discount>max.discount?{...offer,discount}:max;
    },{discount:0});
}

static calculateDiscount(offer,productPrice){
    if(offer.type==='percentage'){
        let discount=(productPrice*offer.discountValue)/100;
        if(offer.maxDiscount){
            discount=Math.min(discount,offer.maxDiscount);
        }
        return discount;
    }else if(offer.type==='fixed'){
        return Math.min(offer.discountValue,productPrice);
    }
    return 0;
}

static async getProductsByCategory(categoryId,page=1,limit=6){
logger.debug('fetching products by category',{categoryId,page,limit});
const query={
    category:categoryId,
    isDeleted:false,
    isActive:true
};

return await this.getProductsWithFilters({
    query,
    page,
    limit,
    sort:'createdAt',
    direction:-1
});
}

 static async getAllProducts() {
        logger.debug('Fetching all active products');
        
        const products = await Product.find({ isActive: true, isDeleted: false })
            .populate("category")
            .populate("bestOffer")
            .lean();

        const processedProducts = await this.applyOffersToProducts(products);
        
        logger.info('All products fetched successfully', { count: processedProducts.length });
        return processedProducts;
    }

 static buildProductQuery(filters) {
        const { 
            categories, 
            availability, 
            colors, 
            minPrice, 
            maxPrice,
            search 
        } = filters;

        let query = { isActive: true, isDeleted: false };

        
        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }

        
        if (categories && categories.length > 0) {
            query.category = { $in: categories };
        }

      
        if (availability && availability.length > 0) {
            const hasInStock = availability.includes('in-stock');
            const hasOutOfStock = availability.includes('out-stock');
            
            if (hasInStock && !hasOutOfStock) {
                query.stock = { $gt: 0 };
            } else if (!hasInStock && hasOutOfStock) {
                query.stock = { $lte: 0 };
            }
        }

      
        if (colors && colors.length > 0) {
            query.color = { $in: colors };
        }

    
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined && minPrice !== "") {
                query.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== "") {
                query.price.$lte = Number(maxPrice);
            }
        }

        logger.debug('Built product query', { query });
        return query;
    }

    static getSortOptions(sort) {
        switch (sort) {
            case 'price-asc':
                return { sort: 'price', direction: 1 };
            case 'price-desc':
                return { sort: 'price', direction: -1 };
            case 'name-asc':
                return { sort: 'productName', direction: 1 };
            case 'name-desc':
                return { sort: 'productName', direction: -1 };
            default:
                return { sort: 'createdAt', direction: -1 };
        }
    }
}




export default ShopService;
