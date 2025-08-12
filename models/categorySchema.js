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

 categoryOffer: {
  value: { type: Number, default: 0 },
  type: { type: String, 
    enum: ['percentage', 'flat'],
     default: 'flat' 
    } 
},

  image: {
    type: String, 
    default: null,
  },
  isDeleted:{
     type: Boolean,
    default: false,
  },
 
},
 {timestamps:true});
const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
