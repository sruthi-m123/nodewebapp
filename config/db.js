import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    console.log("Mongo url used:", process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("connected to mongodb atlas");
  } catch (error) {
    logger.error(`monogoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
