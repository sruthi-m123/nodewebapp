import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

const connectDB=async()=>{
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('connected to mongodb atlas');
  } catch (error) {
    logger.error(`monogoDB connection error:${error.message}`);
    process.exit(1);
  }
}
export default connectDB;