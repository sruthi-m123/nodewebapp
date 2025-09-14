// helpers/orderCalculation.js
function calculateOrder(cartItems, options = {}) {
    const { coupon = null, taxRate = 18 } = options;

    // Subtotal (before discounts)
    const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.originalPrice * item.quantity),
        0
    );

    // Delivery charge
    const delivery = subtotal > 500 ? 0 : 50;

    // Offer discount (product-level)
    let offerDiscount = 0;
    for (const item of cartItems) {
        if (item.discountedPrice) {
            const itemDiscount = (item.originalPrice - item.discountedPrice) * item.quantity;
            offerDiscount += itemDiscount;
        }
    }

    // Coupon discount
    let couponDiscount = 0;
    if (coupon) {
        if (coupon.type === "percentage") {
            couponDiscount = ((subtotal - offerDiscount) * coupon.value) / 100;
        } else if (coupon.type === "flat") {
            couponDiscount = coupon.value;
        }
    }

    const discount = offerDiscount + couponDiscount;

    // Net amount (before tax)
    const netAmount = subtotal + delivery - discount;

    // Tax
    const tax = netAmount * (taxRate / 100);

    // Final total
    const total = netAmount + tax;

    return {
        subtotal,
        delivery,
        offerDiscount,
        couponDiscount,
        discount,
        netAmount,
        tax,
        total
    };
}

module.exports = { calculateOrder };
