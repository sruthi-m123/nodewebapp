const mongoose = require("mongoose");
const env = require("dotenv").config();
const connectDB = async function () {
  try {
    console.log("MongoDB URI:", process.env.MONGODB_URI); // Add this line
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("DB connected");
  } catch (error) {
    console.log("DB connection error", error.message);
    process.exit(1);
  }
};
module.exports = connectDB;
