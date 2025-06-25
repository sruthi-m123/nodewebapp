const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage destinations
const getUploadPath = (uploadType) => {
  const paths = {
     avatar: 'public/img/admin/admin-avatar',
    product: 'public/img/admin/products',
    category: 'public/img/category',  
     review: 'public/img/admin/reviews',
    admin: 'public/img/admin',
    logo:'public/img/admin/logo'
  };
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(paths[uploadType])) {
    fs.mkdirSync(paths[uploadType], { recursive: true });
  }
  
  return paths[uploadType];
};

// Main storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadType;
    
    // Determine upload type based on fieldname or route
    if (file.fieldname === 'avatar') {
      uploadType = 'avatar';
    } else if (file.fieldname === 'productImages' || req.baseUrl.includes('/products')) {
      uploadType = 'product';
    } else if (file.fieldname === 'categoryImage' || req.baseUrl.includes('/categories')) {
      uploadType = 'category';
    } else if (file.fieldname === 'bannerImage') {
      uploadType = 'banner';
    } else {
      uploadType = 'misc';
    }
    
    cb(null, getUploadPath(uploadType));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname).toLowerCase();
    // Determine uploadType again for filename
    let uploadType = 'file';
    if (file.fieldname === 'avatar') uploadType = 'avatar';
    else if (file.fieldname === 'productImages') uploadType = 'product';
    else if (file.fieldname === 'categoryImage') uploadType = 'category';
    
    cb(null, `${uploadType}-${uniqueId}${fileExt}`);
  }
});

// Advanced file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${Object.values(allowedTypes).join(', ')} are allowed.`), false);
  }
};

// Optimized file size limits
const limits = {
  avatar: { fileSize: 2 * 1024 * 1024 }, // 2MB
  product: { fileSize: 5 * 1024 * 1024 }, // 5MB
  category: { fileSize: 3 * 1024 * 1024 }, // 3MB
  default: { fileSize: 2 * 1024 * 1024 } // 2MB
};

// Create upload handlers for different use cases
const upload = {
  // Single image uploads
  avatar: multer({
    storage,
    fileFilter,
    limits: limits.avatar
  }).single('avatar'),

  // Multiple product images
  products: multer({
    storage,
    fileFilter,
    limits: limits.product
  }).array('productImages', 10), // Up to 10 files

  // Single category image
  category: multer({
    storage,
    fileFilter,
    limits: limits.category
  }).single('categoryImage'),

  // Mixed uploads (for complex forms)
  mixed: multer({
    storage,
    fileFilter,
    limits: limits.default
  }).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 5 }
  ])
};

// Image processing middleware
const processImage = async (req, res, next) => {
  if (!req.file && !req.files) return next();
  
  try {
    // Image processing logic here
    next();
  } catch (err) {
    next(err);
  }
};

// Export configuration
module.exports = {
  upload,       // Named upload handlers
  processImage, // Image processing middleware
  singleUpload: multer({ storage, fileFilter, limits: limits.default }).single('image'),
  multiUpload: multer({ storage, fileFilter, limits: limits.product }).array('images', 5)
};