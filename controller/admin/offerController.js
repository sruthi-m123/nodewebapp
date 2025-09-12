
const Offer=require('../../models/offerSchema');
const Product=require('../../models/productSchema');
const Category=require('../../models/categorySchema');
const {updateProductsOffer}=require('../../utils/bestOffer');
const getOfferPage=async(req,res)=>{
    try{
const currentPage=parseInt(req.query.page)||1;
const limit=6;
const offerType=req.query.type||'all';

let query={isActive:true};
if(offerType!=='all'){
    query.applicableTo=offerType;
}

const totalOffers= await Offer.countDocuments(query);
const totalPages=Math.ceil(totalOffers/limit);
const products=await Product.find(query);
const categories = await Category.find({status:'active'} ).sort({name:1});
console.log("categories inside the offer page:",categories)
const offers=await Offer.find(query)
.sort({createdAt:-1})
.skip((currentPage-1)*limit)
.limit(limit);

res.render("admin/offer",{
    layout:false,
    offers,
    currentPage,
    totalPages,
    offerType,
    categories,
    products
});
    }catch(error){
        console.error('error fetching offers:',error);
        res.status(500).send('Server Error');
    }

}
const getApplicableItems = async (req, res) => {
    try {
        const type = req.query.type;
        let items = [];
        
        if (type === 'category') {
            items = await Category.find({}, 'name');
        } else if (type === 'product') { 
            items = await Product.find({}, 'productName price images');
        }

        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
}

const createOffer = async (req, res) => {
    try {
        const {
            title,
            code,
            type,
            discountValue,
            applicableTo,
            startDate,
            endDate,
            minOrderValue,
            maxDiscount,
            usageLimit,
            isActive,
            applicableItems
        } = req.body;

        console.log("Raw request body:", req.body);

        if (!title?.trim()) {
            return res.status(400).json({ message: 'Offer title is required' });
        }
        if (!code?.trim()) {
            return res.status(400).json({ message: 'Offer code is required' });
        }
        if (!type?.trim()) {
            return res.status(400).json({ message: 'Discount type is required' });
        }
        if (discountValue === undefined || discountValue === null || discountValue === '') {
            return res.status(400).json({ message: 'Discount value is required' });
        }
        if (!applicableTo?.trim()) {
            return res.status(400).json({ message: 'Applicable to field is required' });
        }
        if (!startDate) {
            return res.status(400).json({ message: 'Start date is required' });
        }
        if (!endDate) {
            return res.status(400).json({ message: 'End date is required' });
        }

        if (isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
            return res.status(400).json({ message: 'Discount value must be a positive number' });
        }

        if (type === 'percentage' && Number(discountValue) > 100) {
            return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const existingOffer = await Offer.findOne({ code: code.toUpperCase().trim() });
        if (existingOffer) {
            return res.status(400).json({ message: 'Offer code already exists' });
        }

        let finalApplicableItems = [];
        if (applicableTo !== 'all') {
            if (!applicableItems || !Array.isArray(applicableItems) || applicableItems.length === 0) {
                return res.status(400).json({ 
                    message: `Please select at least one ${applicableTo === 'category' ? 'category' : 'product'}` 
                });
            }
            finalApplicableItems = applicableItems;
        }

        const minOrderValueNum = minOrderValue !== undefined && minOrderValue !== null && minOrderValue !== '' 
            ? Number(minOrderValue) : 0;
        
        if (isNaN(minOrderValueNum) || minOrderValueNum < 0) {
            return res.status(400).json({ message: 'Minimum order value must be a positive number or zero' });
        }

        let maxDiscountValue = null;
        if (type === 'percentage' && maxDiscount !== undefined && maxDiscount !== null && maxDiscount !== '') {
            maxDiscountValue = Number(maxDiscount);
            if (isNaN(maxDiscountValue) || maxDiscountValue <= 0) {
                return res.status(400).json({ message: 'Maximum discount must be a positive number' });
            }
        }

        let finalUsageLimit = null;
        if (usageLimit !== undefined && usageLimit !== null && usageLimit !== '') {
            finalUsageLimit = Number(usageLimit);
            if (isNaN(finalUsageLimit) || finalUsageLimit <= 0) {
                return res.status(400).json({ message: 'Usage limit must be a positive number' });
            }
        }

        const isOfferActive = isActive === true || String(isActive).toLowerCase() === 'true';

        const newOffer = new Offer({
            title: title.trim(),
            code: code.toUpperCase().trim(),
            type,
            discountValue: Number(discountValue),
            applicableTo,
            applicableItems: finalApplicableItems,
            startDate: start,
            endDate: end,
            minOrderValue: minOrderValueNum,
            maxDiscount: maxDiscountValue,
            usageLimit: finalUsageLimit,
            isActive: isOfferActive,
            usedCount: 0
        });

        console.log("Processed offer:", newOffer);
        
        await newOffer.save();
        console.log("before update bestoffer ")
await updateProductsOffer(newOffer);
console.log("after updatebestoffer");

        res.status(201).json({
            success: true,
            message: 'Offer created successfully',
            offer: newOffer
        });
        
    } catch (error) {
        console.error("Offer creation failed:", error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error: ' + messages.join(', ')
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Offer code already exists'
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to create offer',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// const deleteOffer=async(req,res)=>{
//     try{
// const{offerId}=req.params;
// console.log("offerId:",offerId);
// const offers= await Offer.findOne({_id:offerId});
// console.log("offers to delete:",offers);
// if(!offers){
//    return res.status(404).json({message:"offer not found"})
// }
// await Offer.findOneAndDelete({_id:offerId});
// res.status(200).json({success:true,message:"offer successfully deleted"})
 
// }catch(error){
// console.error("error deleting the offer:",error);
// res.status(500).json({success:false,message:"server error while deleting the offer"})
// }
// }


const deleteOffer=async(req,res)=>{
    try {
        const {offerId}=req.params;
        const offer=await Offer.findOne({_id:offerId});
        if(!offer){
            return res.status(200).json({
                success:true,
                message:"Offer already deleted"
            });
        }
offer.isDeleted=true;
offer.isActive=false;
await offer.save();

await Product.updateMany({bestOffer:offer._id},{$unset:{bestOffer:""}})

res.status(200).json({
    success:true,
    message:"offer successfully deleted"
})
    } catch (error) {
      console.error("error deleting the offer:",error);
      res.status(500).json({
        successs:false,
        message:"server error while deleting the offer"
      })  
    }
}

const getEditOffer=async (req,res)=>{
try {
    const {id}=req.params;
    console.log("offerId",id);
    const offer=await Offer.findById(id)
    .populate('applicableItems','name price images')
    .lean();

    if(!offer){
        return res.status(404).json({
            success:false,
            message:'Offer not found'
        });
    }
    if (offer.startDate && !isNaN(new Date(offer.startDate).getTime())) {
    offer.startDate = new Date(offer.startDate).toISOString().split('T')[0];
}

if (offer.endDate && !isNaN(new Date(offer.endDate).getTime())) {
    offer.endDate = new Date(offer.endDate).toISOString().split('T')[0];
}
console.log("startDate in DB:", offer.startDate);
console.log("endDate in DB:", offer.endDate);

if (offer.applicableItems && offer.applicableItems.length > 0) {
            offer.applicableItems = offer.applicableItems.map(item => item._id.toString());
        }

        res.status(200).json({ 
            success: true, 
            offer 
        });

} catch (error) {
    console.error('Error fetching offer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching offer' 
        });
    }
}
const updateOffer=async(req,res)=>{
    try {
   
      const offerId=req.params.id;
      const updateData={
        ...req.body,
        startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
             applicableItems: req.body.applicableItems || []
      }
      const existingOffer = await Offer.findOne({ 
            code: req.body.code, 
            _id: { $ne: offerId } 
        });
 if (existingOffer) {
            return res.status(400).json({ 
                success: false, 
                message: 'Offer code already in use' 
            });
        }

        const updateOffer=await Offer.findByIdAndUpdate(
            offerId,
            updateData,
            {new:true,runValidators:true}
        );

      if (!updateOffer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Offer not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Offer updated successfully',
            offer: updateOffer
        });

    } catch (error) {
          console.error('Error updating offer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating offer' 
        });
    }
    }
  

module.exports = { getOfferPage,
     getApplicableItems,
      createOffer,
      deleteOffer,
    updateOffer,
    getEditOffer

    };