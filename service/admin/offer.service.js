import Offer from '../../models/offerSchema.js';
import Product from '../../models/productSchema.js';
import Category from '../../models/categorySchema.js';
import { updateProductsOffer } from '../../helper/bestOffer.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';


export const getOffersService = async (currentPage = 1, limit = 6, offerType = 'all') => {
    logger.debug('fetching offers', { currentPage, limit, offerType });

    let query = {
        isActive: true,
        endDate: { $gte: new Date() }
    };
    if (offerType !== 'all') {
        query.applicableTo = offerType;
    }

    const totalOffers = await Offer.countDocuments(query);
    const totalPages = Math.ceil(totalOffers / limit);

    const offers = await Offer.find(query)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * limit)
        .limit(limit);

    logger.info('Offers fetched successfully', {
        count: offers.length,
        totalPages
    });
    return { offers, totalPages };
}

export const getApplicableItemService = async (type) => {
    logger.debug('fetching applicable items', { type });
    let items = [];
    if (type === 'category') {
        items = await Category.find({ isActive: true, isDeleted: false }, 'name');
    } else if (type === 'product') {
        items = await Product.find({ isActive: true, isDeleted: false }, 'productName price images');
    }

    logger.info('Applicable items fetched', { type, count: items.length })
    return items;
}

export const createOfferService = async (offerData) => {
    const {
        title,
        type,
        discountValue,
        applicableTo,
        applicableItems,
        startDate,
        endDate,
        minOrderValue,
        maxDiscount,
        usageLimit,
        isActive
    } = offerData;

    logger.debug('creating new Offer', { title, type });

    const existingOffer = await Offer.findOne({
        title: title.trim(),
        isActive: true
    });

    if (existingOffer) {
        logger.warn('Duplicate offer creation attemppt', { title });
        throw new Error(MESSAGES.OFFER.DUPLICATE_TITLE);
    }

    const normalizedType = type === 'flat' ? 'fixed' : type;

    if (normalizedType === 'fixed' && applicableTo !== 'all') {
        await validateFixedDiscountForItems(applicableTo, applicableItems, discountValue);

    }

    const newOffer = new Offer({
        title: title.trim(),
        type: normalizedType,
        discountValue: Number(discountValue),
        applicableTo,
        applicableItems: applicableItems || [],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minOrderValue: minOrderValue || 0,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        isActive: isActive === true || String(isActive).toLowerCase() === 'true',
        usedCount: 0
    })



    await newOffer.save();


    await updateProductsOffer(newOffer);
    logger.info('offer created successfullly', { offerId: newOffer._id, title });
    return newOffer;
}

export const deleteOfferService = async (offerId) => {
    logger.debug('Deleting offer', { offerId });
    console.log("offerId inisde the delete offersrvice :", offerId);

    const offer = await Offer.findById(offerId);
    if (!offer) {
        logger.warn('offer not found for deletion', { offerId });
        throw new Error(MESSAGES.OFFER.NOT_FOUND);

    }
    console.log("offer to delete:", offer);

    await Product.updateMany(
        { bestOffer: offer._id },
        { $unset: { bestOffer: "", discountedPrice: "", discount: "" } }
    );
    const affectedProducts = await Product.find({ _id: { $in: offer.applicableItems } });
    await updateProductsOffer({ applicableTo: 'all', applicableItems: [] });
    console.log("offer", offer);

    // await Offer.findByIdAndDelete(offerId);
    await Offer.updateOne({ _id: offerId }, {
        $set: {
            isActive: false,
            isDeleted: true
        }
    });
    logger.info('offer deleted successfully', { offerId });
    return offer;
}

export const getEditOfferService = async (offerId) => {
    logger.debug('fetching the offer for edit:', { offerId });
    console.log("offerId", offerId);
    const offer = await Offer.findById(offerId)
        .populate('applicableItems', 'name price images productName')
        .lean();
    if (!offer) {
        logger.warn('Offernnot found for editing', { offerId });
        throw new Error(MESSAGES.OFFER.NOT_FOUND);
    }

    if (offer.startDate && !isNaN(new Date(offer.startDate).getTime())) {
        offer.startDate = new Date(offer.startDate).toISOString().split('T')[0];
    }

    if (offer.endDate && !isNaN(new Date(offer.endDate).getTime())) {
        offer.endDate = new Date(offer.endDate).toISOString().split('T')[0];
    }

    if (offer.applicableItems && offer.applicableItems.length > 0) {
        offer.applicableItems = offer.applicableItems.map(item => item._id.toString());
    }
    logger.debug('offer fetched successfullly for editing', { offerId });
    return offer;
}

export const updateOfferService = async (offerId, updateData) => {
    const {
        title,
        type,
        discountValue,
        applicableTo,
        applicableItems,
        startDate,
        endDate,

    } = updateData;
    logger.debug('Updating offer', { offerId, title });

    const trimmedTitle = title?.trim();
    const existingOffer = await Offer.findOne({
        title: { $regex: new RegExp(`^${trimmedTitle}$`, 'i') },
        _id: { $ne: offerId }
    })
    if (existingOffer) {
        logger.warn('Duplicate offer title during update', { title: trimmedTitle });
        throw new Error(MESSAGES.OFFER.DUPLICATE_TITLE);
    }
    const normalizedType = type === 'flat' ? 'fixed' : type;

    if (normalizedType === 'fixed' && applicableTo && applicableTo !== 'all') {
        await validateFixedDiscountForItems(applicableTo, applicableItems, discountValue);
    }

    const formattedUpdateData = {
        ...updateData,
        title: trimmedTitle,
        type: normalizedType,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...applicableItems && { applicableItems }
    }

    const updateOffer = await Offer.findByIdAndUpdate(
        offerId,
        formattedUpdateData,
        { new: true, runValidators: true }
    );

    if (!updateOffer) {
        logger.warn('Offer not found for update', { offerId });
        throw new Error(MESSAGES.OFFER.NOT_FOUND);
    }

    await updateProductsOffer(updateOffer);

    logger.info('Offer updated successfully', { offerId });
    return updateOffer;
}

const validateFixedDiscountForItems = async (applicableTo, applicableItems, discountValue) => {

    if (!applicableItems || !Array.isArray(applicableItems) || applicableItems.length === 0) {
        throw new Error(`Please select at least one ${applicableTo === 'category' ? 'category' : 'product'}`);
    }

    let relevantProductIds = [];
    if (applicableTo === 'product') {
        relevantProductIds = applicableItems;
    } else if (applicableTo === 'category') {
        const categories = await Category.find({ _id: { $in: applicableItems } }).populate('products');
        relevantProductIds = categories.flatMap(cat => cat.products ? cat.products.map(p => p._id) : []);
    }

    if (relevantProductIds.length === 0) {
        throw new Error('No valid products found for the selected items');
    }

    const products = await Product.find({ _id: { $in: relevantProductIds } }, 'price');
    const minPrice = Math.min(...products.map(p => p.price));
    if (discountValue > minPrice) {
        throw new Error(`fixed discount (${discountValue}) cannot exceed the lowest item price (${minPrice})`)
    }
}
