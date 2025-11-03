const Coupon = require("../../models/couponSchema");

const getCouponPage = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.render('admin/coupons', {
            coupons,
            layout: false,
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({success:false,message:"server error"});
    }
};

const createCoupon=async(req,res)=>{
    console.log("the create coupon controller");
    try {
        const body=Object.fromEntries(
            Object.entries(req.body).map(([key,val])=>[key,val?.toString()||""])
        );
const {
    description,
    code,
    discountType,
    discountValue,
    redeemAmount,
    minCartValue,
    validFrom,
    validTill,
    usageLimit,
    isActive,

}=body;

//validation

if(!code){
    return res.status(400).json({success:false,message:"coupon code is required"});
    }
    if(!discountType){
        return res.status(400).json({success:false,message:"Discount type is required"});
            }
            if(!validFrom||!validTill){
                return res.status(400).json({success:false,message:"valid from and valid dates are required"});
                            }
                            if(!description){
                                return res.status(400).json({success:false,message:"Description is required"})
                            }
                            if(discountType==="fixed"&& !discountValue){
                                return res.status(400).json({success:false,message:"Discount type and discount value is needed to add"});
                                                            }

    if (usageLimit && Number(usageLimit) < 1) {
      return res.status(400).json({ success: false, message: "Usage limit must be at least 1" });
    }

//date validation
const parsedValidFrom=new Date(validFrom);
const parsedValidTill=new Date(validTill);

if(isNaN(parsedValidFrom.getTime())||isNaN(parsedValidTill.getTime())){
    return res.status(400).json({success:false,message:"Invalid date format"})
}

if(parsedValidFrom>=parsedValidTill){
    return res.status(400).json({success:false,message:"Valid Till date must be after Valid From date "});
};

//Duplicate checking

const existingCoupon=await Coupon.findOne({description:description.trim(),
    discountType,
    discountValue
});
if(existingCoupon){
return res.status(400).json({success:false,message:"coupon already exists"});
}

//create Data

const couponData={
    description,
    code,
    discountType,
    discountValue:discountValue? parseFloat(discountValue):0,
    redeemAmount: redeemAmount ? parseFloat(redeemAmount) : 0,
      minCartValue: minCartValue ? parseFloat(minCartValue) : 0,
      validFrom: parsedValidFrom,
      validTill: parsedValidTill,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      isActive: isActive === "on" || isActive === true || isActive === "true"
}
console.log("finally formated coupondata:",couponData);

//saving

const coupon=new Coupon (couponData);
await coupon.save();
console.log("coupon created successfullly");
res.status(200).json({success:true,message:"coupon added successfully",data:coupon})
    } catch (error) {
        res.status(500).json({success:false,message:"something went wrong"})
    }
}



const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        console.log("coupon",coupon);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        res.json(coupon);
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateCoupon = async (req, res) => {
    try {
        console.log("re.body inside the controller of updatecoupon",req.body);
        const { 
            description, 
            code, 
            discountType,
            discountValue,
            redeemAmount,
            minCartValue, 
            validFrom,
            validTill, 
            usageLimit,
            isActive 
        } = req.body;

        if (validTill && validFrom) {
            const parsedValidTill = new Date(validTill);
            const parsedValidFrom = new Date(validFrom);
            
            if (isNaN(parsedValidTill.getTime()) || isNaN(parsedValidFrom.getTime())) {
                return res.status(400).json({success:false, message: "Valid dates are required" });
            }

            if (parsedValidFrom >= parsedValidTill) {
                return res.status(400).json({ success:false,message: "Valid Till date must be after Valid From date" });
            }
        }

        if (code) {
            const existingCoupon = await Coupon.findOne({ 
                code: code.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            if (existingCoupon) {
                return res.status(400).json({ success:false,message: "Coupon code already exists" });
            }
        }

        const updateData = {
            description,
            code: code ? code.toUpperCase() : undefined,
            discountType,
            discountValue: discountValue ? parseFloat(discountValue) : undefined,
            redeemAmount: redeemAmount ? parseFloat(redeemAmount) : undefined,
            minCartValue: minCartValue ? parseFloat(minCartValue) : undefined,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTill: validTill ? new Date(validTill) : undefined,
            usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
            isActive: isActive === 'on' || isActive === true || isActive === 'true'
        };

        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({ success:false,error: 'Coupon not found' });
        }

        res.status(200).json({ success:true,message: "Coupon updated successfully", coupon });
    } catch (error) {
        console.error("Update error:", error);
        res.status(400).json({ message:false,success:false,error: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id,{isDeleted:true},{new:true});
        if (!coupon) {
            return res.status(404).json({success:false, error: 'Coupon not found' });
        }
        res.status(200).json({ success:true,message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({success:false, error: 'Server error' });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code, cartValue } = req.body;
        const result = await Coupon.validateCoupon(code, cartValue);
        res.json(result);
    } catch (error) {
        console.error("Validation error:", error);
        res.status(500).json({success:false, error: 'Server Error' });
    }
};

module.exports = {
    getCouponPage,
    createCoupon,
    getCouponById,
    deleteCoupon,
    updateCoupon,
    validateCoupon
};