
function calculateOrder(cartItems, options = {}) {
    const { coupon = null, taxRate = 18 } = options;
console.log("coupon passed to calaculateorder",coupon);
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
        console.log("Coupon type:", coupon.type);
        if (coupon.type === "percentage") {
            couponDiscount = ((subtotal - offerDiscount) * coupon.value) / 100;
        } else if (coupon.type === "fixed"||coupon.type==="flat") {
            couponDiscount = coupon.value;
        }
    }
console.log("Calculated couponDiscount:", couponDiscount);console.log("hiiiiiii");
    const discount = offerDiscount + couponDiscount;
   

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
