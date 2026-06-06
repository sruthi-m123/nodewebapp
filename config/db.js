<<<<<<< Updated upstream
import mongoose from "mongoose";
import logger from "../utils/logger.js";
=======
const mongoose = require("mongoose");
const env = require("dotenv").config();
const connectDB = async function () {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
>>>>>>> Stashed changes

const connectDB = async () => {
  try {
    console.log("Mongo url used:", process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("connected to mongodb atlas");
  } catch (error) {
<<<<<<< Updated upstream
    logger.error(`monogoDB connection error: ${error.message}`);
=======
    console.log("error:",error);
    console.log("DB connection error", error.message);
>>>>>>> Stashed changes
    process.exit(1);
  }
};

export default connectDB;
