const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  // code: {
  //   type: String,
  //   unique: true,
  //   trim: true,
  //   default: "",
  // },
  status: {
    type: String,
    enum: ["active", "inactive","on","off"],
    default: "active",
    set: function(value) { // Add setter to normalize values
      if (value === 'on') return 'active';
      if (value === 'off') return 'inactive';
      return value;
    }
  },

  // categoryOffer: {
  //   type: Number,
  //   default: 0,
  // },
  image: {
    type: String, // Path to image (like "/uploads/categories/filename.jpg")
    default: null,
  },
  isDeleted:{
     type: Boolean,
    default: false,
  }
});
const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
