
function calculateOrder(cartItems, options = {}) {
 
    const { coupon = null, taxRate = 18 } = options;
console.log("coupon passed to calaculateorder",coupon);
console.log("cartitems passed to cal:",cartItems);

    const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.originalPrice * item.quantity),
        0
    );

    const delivery = subtotal > 500 ? 0 : 50;
    let itemDiscount;

    let offerDiscount = 0;
    for (const item of cartItems) {
        if (item.discountedPrice) {
             itemDiscount = (item.originalPrice - item.discountedPrice) * item.quantity;
            offerDiscount += itemDiscount;
        }
    }

    let couponDiscount = 0;
    if (coupon) {
        console.log("Coupon type:", coupon.discountType);
        if (coupon.discountType === "percentage") {
            couponDiscount = ((subtotal - offerDiscount) * coupon.discountValue) / 100;
        } else if (coupon.discountType === "fixed"||coupon.discountType==="flat") {
            couponDiscount = coupon.discountValue;
            console.log("discount value inside calculateOrder:",couponDiscount)
        }
    }
console.log("Calculated couponDiscount:", couponDiscount);
    const discount = offerDiscount + couponDiscount;
   console.log("offerDiscount",offerDiscount);
   console.log("couponDiscount",couponDiscount);
   console.log("discount:",discount);

    const netAmount = subtotal + delivery - discount;

    const tax = netAmount * (taxRate / 100);

    const total = netAmount + tax;
    return {
        subtotal,
        delivery,
        offerDiscount,
        couponDiscount,
        discount,
        netAmount,
        tax,
        total,
        itemDiscount
    };
}

module.exports = { calculateOrder };
