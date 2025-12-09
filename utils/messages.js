
export const MESSAGES = {
    ADMIN:{
  LOGIN_SUCCESS: "Admin logged in successfully.",
  INVALID_PASSWORD: "Invalid password.",
  INVALID_EMAIL: "Invalid email or not an admin.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later.",
  LOGOUT_SUCCESS: "Admin logged out successfully.",
  DASHBOARD_ERROR: "Error loading dashboard.",
},
CATEGORY:{
    FETCH_SUCCESS:"Categories fetched successfully",
    ADD_SUCCESS:"Category added successfully",
    UPDATE_SUCCESS:"Category updated successfully",
    DELETE_SUCCESS:"Category deleted sucessfully",
    DUPLICATE: "Category already exists",
    NOT_FOUND: "Category not found",
    INVALID_STATUS: "Invalid status value",
    IMAGE_ERROR: "Invalid or missing image file",
    SERVER_ERROR: "Server error while processing category",
},
  ADDRESS: {
        LOGIN_REQUIRED: "Please login to continue",
        ADD_SUCCESS: "Address added successfully",
        UPDATE_SUCCESS: "Address updated successfully",
        DELETE_SUCCESS: "Address deleted successfully",
        SET_DEFAULT_SUCCESS: "Default address set successfully",
        NOT_FOUND: "Address not found",
        NO_CHANGES: "Address not found or no changes applied",
        NO_ADDRESSES: "No addresses found",
        REQUIRED_FIELDS: "Please fill all required fields",
        INVALID_PHONE: "Phone number must be 10 digits",
        INVALID_PHONE_SAME: "Phone number cannot have all digits the same",
        INVALID_ALT_PHONE: "Alternate phone must be 10 digits",
        INVALID_ALT_PHONE_SAME: "Alternate phone cannot have all digits the same",
        INVALID_PINCODE: "Pincode must be 6 digits",
        INVALID_ADDRESS_TYPE: "Invalid address type",
        UNAUTHORIZED: "Unauthorized: No session found"
    },
    CART: {
    LOGIN_REQUIRED: "Please login to continue shopping",
    ADD_SUCCESS: "Added to cart",
    REMOVE_SUCCESS: "Item removed from cart",
    UPDATE_SUCCESS: "Cart updated successfully",
    REMOVE_INVALID_SUCCESS: "Invalid items removed from cart successfully",
    EMPTY: "Your cart is empty",
    NOT_FOUND: "Cart not found",
    ITEM_NOT_FOUND: "Item not found in cart",
    OUT_OF_STOCK: "Product out of stock",
    EXCEEDS_LIMIT: "Maximum {limit} items per order",
    EXCEEDS_STOCK: "Only {stock} units available",
    VALIDATION_ERROR: "Some items exceed stock",
    SERVER_ERROR: "Internal server error"
},
COUPON: {
    // Success messages
    CREATE_SUCCESS: "Coupon created successfully",
    UPDATE_SUCCESS: "Coupon updated successfully",
    DELETE_SUCCESS: "Coupon deleted successfully",
    FETCH_SUCCESS: "Coupons fetched successfully",
    
    // Error messages
    NOT_FOUND: "Coupon not found",
    DUPLICATE: "Coupon already exists",
    DUPLICATE_CODE: "Coupon code already exists",
    CODE_REQUIRED: "Coupon code is required",
    DISCOUNT_TYPE_REQUIRED: "Discount type is required",
    DISCOUNT_VALUE_REQUIRED: "Discount value is required",
    DESCRIPTION_REQUIRED: "Description is required",
    DATES_REQUIRED: "Valid from and valid till dates are required",
    INVALID_DATE_FORMAT: "Invalid date format",
    INVALID_DATE_RANGE: "Valid till date must be after valid from date",
    INVALID_USAGE_LIMIT: "Usage limit must be at least 1",
    SERVER_ERROR: "Server error while processing coupon",
    VALIDATION_ERROR: "Coupon validation failed"
},

OFFER: {
    // Success messages
    CREATE_SUCCESS: "Offer created successfully",
    UPDATE_SUCCESS: "Offer updated successfully",
    DELETE_SUCCESS: "Offer deleted successfully",
    FETCH_SUCCESS: "Offers fetched successfully",
    
    // Error messages
    NOT_FOUND: "Offer not found",
    DUPLICATE_TITLE: "An offer with this title already exists",
    TITLE_REQUIRED: "Offer title is required",
    TYPE_REQUIRED: "Offer type is required",
    DISCOUNT_VALUE_REQUIRED: "Discount value is required",
    APPLICABLE_TO_REQUIRED: "Applicable to field is required",
    START_DATE_REQUIRED: "Start date is required",
    END_DATE_REQUIRED: "End date is required",
    INVALID_DATE_FORMAT: "Invalid date format",
    INVALID_DATE_RANGE: "End date must be after start date",
    INVALID_USAGE_LIMIT: "Usage limit must be at least 1",
    INVALID_DISCOUNT_VALUE: "Discount value must be a positive number",
    INVALID_PERCENTAGE: "Percentage discount cannot exceed 95%",
    NO_APPLICABLE_ITEMS: "Please select at least one applicable item",
    FIXED_DISCOUNT_EXCEEDS_PRICE: "Fixed discount cannot exceed item price",
    SERVER_ERROR: "Server error while processing offer",
    VALIDATION_ERROR: "Offer validation failed"
}
};
