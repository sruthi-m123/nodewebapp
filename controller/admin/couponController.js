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
        res.status(500).send('Server error');
    }
};

const createCoupon = async (req, res) => {
    console.log("Hit the coupon controller");
    console.log("req.body:", req.body);
    try {
        const { 
            description, 
            code, 
            discountType,
            discountValue,
            redeemAmount,
            minCartValue, 
            minDiscount,
            maxDiscount,
            validFrom,
            validTill, 
            usageLimit,
            isActive 
        } = req.body;

        if (!description || !code || !discountType || !validTill || !validFrom) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const parsedValidFrom = new Date(validFrom);
        const parsedValidTill = new Date(validTill);
        
        if (isNaN(parsedValidFrom.getTime()) || isNaN(parsedValidTill.getTime())) {
            return res.status(400).json({ message: "Valid dates are required" });
        }

        if (parsedValidFrom >= parsedValidTill) {
            return res.status(400).json({ message: "Valid Till date must be after Valid From date" });
        }

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
        }

        const formatData = {
            description,
            code: code.toUpperCase(),
            discountType: discountType || 'fixed',
            discountValue: discountValue ? parseFloat(discountValue) : 0,
            redeemAmount: redeemAmount ? parseFloat(redeemAmount) : 0,
            minCartValue: minCartValue ? parseFloat(minCartValue) : 0,
            minDiscount: minDiscount ? parseFloat(minDiscount) : 0,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
            validFrom: parsedValidFrom,
            validTill: parsedValidTill,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            isActive: isActive === 'on' || isActive === true || isActive === 'true'
        };

        const coupon = new Coupon(formatData);
        await coupon.save();
        console.log("Created coupon:", coupon);
        
        res.status(200).json({ message: "Coupon added successfully" });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: error.message });
    }
};

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
            minDiscount,
            maxDiscount,
            validFrom,
            validTill, 
            usageLimit,
            isActive 
        } = req.body;

        if (validTill && validFrom) {
            const parsedValidTill = new Date(validTill);
            const parsedValidFrom = new Date(validFrom);
            
            if (isNaN(parsedValidTill.getTime()) || isNaN(parsedValidFrom.getTime())) {
                return res.status(400).json({ message: "Valid dates are required" });
            }

            if (parsedValidFrom >= parsedValidTill) {
                return res.status(400).json({ message: "Valid Till date must be after Valid From date" });
            }
        }

        if (code) {
            const existingCoupon = await Coupon.findOne({ 
                code: code.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            if (existingCoupon) {
                return res.status(400).json({ message: "Coupon code already exists" });
            }
        }

        const updateData = {
            description,
            code: code ? code.toUpperCase() : undefined,
            discountType,
            discountValue: discountValue ? parseFloat(discountValue) : undefined,
            redeemAmount: redeemAmount ? parseFloat(redeemAmount) : undefined,
            minCartValue: minCartValue ? parseFloat(minCartValue) : undefined,
            minDiscount: minDiscount ? parseFloat(minDiscount) : undefined,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
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
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.status(200).json({ message: "Coupon updated successfully", coupon });
    } catch (error) {
        console.error("Update error:", error);
        res.status(400).json({ error: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code, cartValue } = req.body;
        const result = await Coupon.validateCoupon(code, cartValue);
        res.json(result);
    } catch (error) {
        console.error("Validation error:", error);
        res.status(500).json({ error: 'Server Error' });
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