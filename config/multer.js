import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

<<<<<<< Updated upstream
dotenv.config();
logger.info("hi inside the multer");
logger.info(process.env.CLOUDINARY_API_KEY);
logger.info(process.env.CLOUDINARY_CLOUD_NAME);
logger.info(process.env.CLOUDINARY_API_SECRET);
//Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Dynamic folder structure
const getCloudFolder = (uploadType) => {
  const folders = {
    avatar: "chettinad/uploads/avatar",
    product: "chettinad/admin/products",
    category: "chettinad/admin/category",
    review: "chettinad/admin/reviews",
    admin: "chettinad/admin",
    logo: "chettinad/admin/logo",
    misc: "chettinad/misc",
=======
const getUploadPath = (uploadType) => {
  const paths = {
    avatar: 'public/img/uploads/avatar',
    product: 'public/img/admin/products',
    category: 'public/img/admin/category',
    review: 'public/img/admin/reviews',
    admin: 'public/img/admin',
    logo: 'public/img/admin/logo',
    misc: 'public/img/misc'
>>>>>>> Stashed changes
  };
  return folders[uploadType] || folders.misc;
};

<<<<<<< Updated upstream
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
=======
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
>>>>>>> Stashed changes
    let uploadType;

    if (file.fieldname === "avatar") {
      uploadType = "avatar";
    } else if (file.fieldname === "images" || req.baseUrl.includes("/products")) {
      uploadType = "product";
    } else if (file.fieldname === "categoryImage" || req.baseUrl.includes("/categories")) {
      uploadType = "category";
    } else if (file.fieldname === "bannerImage") {
      uploadType = "banner";
    } else {
      uploadType = "misc";
    }

    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "");

    return {
      folder: getCloudFolder(uploadType),
      format: fileExt || "jpg",
      public_id: `${uploadType}-${uniqueId}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    console.warn("Rejected file type:", file.mimetype);
    cb(
      new Error(`Invalid file type. Only ${Object.values(allowedTypes).join(", ")} are allowed.`),
      false
    );
  }
};

//  Size limits
const limits = {
  avatar: { fileSize: 2 * 1024 * 1024 },
  product: { fileSize: 5 * 1024 * 1024 },
  category: { fileSize: 5 * 1024 * 1024 },
  default: { fileSize: 2 * 1024 * 1024 },
};

//  Upload handlers
export const upload = {
  avatar: multer({ storage, fileFilter, limits: limits.avatar }).single("avatar"),
  products: multer({ storage, fileFilter, limits: limits.product }).array("images", 10),
  category: multer({ storage, fileFilter, limits: limits.category }).single("categoryImage"),
  mixed: multer({ storage, fileFilter, limits: limits.default }).fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 5 },
  ]),
};

// Error handling
export const handleMulterError = (err, req, res, next) => {
  console.error("Multer / File upload error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      alert: {
        title: "Error",
        text:
          err.message === "File too large"
            ? "File size exceeds the limit."
            : "File upload error.",
        icon: "error",
      },
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      alert: {
        title: "Error",
        text: err.message || "Failed to upload file.",
        icon: "error",
      },
    });
  }
  next();
};

// Optional image processing
export const processImage = async (req, res, next) => {
  if (!req.file && !req.files) return next();
  try {
    next();
  } catch (err) {
    next(err);
  }
};

export const singleUpload = multer({ storage, fileFilter, limits: limits.category }).single("categoryImage");
export const multiUpload = multer({ storage, fileFilter, limits: limits.product }).array("images", 5);
