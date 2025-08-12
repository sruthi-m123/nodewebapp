const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage destinations
const getUploadPath = (uploadType) => {
  const paths = {
    avatar: 'public/img/uploads/avatar',
    product: 'public/img/admin/products',
    category: 'public/img/admin/category',
    review: 'public/img/admin/reviews',
    admin: 'public/img/admin',
    logo: 'public/img/admin/logo',
    misc: 'public/img/misc'
  };

  if (!fs.existsSync(paths[uploadType])) {
    fs.mkdirSync(paths[uploadType], { recursive: true });
  }

  return paths[uploadType];
};

// Main storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadType;

    if (file.fieldname === 'avatar') {
      uploadType = 'avatar';
    } else if (file.fieldname === 'images' || req.baseUrl.includes('/products')) {
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
    let uploadType = 'file';
    if (file.fieldname === 'avatar') uploadType = 'avatar';
    else if (file.fieldname === 'images') uploadType = 'product';
    else if (file.fieldname === 'categoryImage') uploadType = 'category';
    cb(null, `${uploadType}-${uniqueId}${fileExt}`);
  }
});

// Advanced file filter
const fileFilter = (req, file, cb) => {
    console.log("👉 Field Received:", file.fieldname);
  console.log("MIME TYPE:", file.mimetype); // Debug
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
     console.warn("❌ Rejected file type:", file.mimetype); 
    cb(new Error(`Invalid file type. Only ${Object.values(allowedTypes).join(', ')} are allowed.`), false);
  }
};

// Optimized file size limits
const limits = {
  avatar: { fileSize: 2 * 1024 * 1024 }, // 2MB
  product: { fileSize: 5 * 1024 * 1024 }, // 5MB
  category: { fileSize: 5 * 1024 * 1024 }, //  5MB
  default: { fileSize: 2 * 1024 * 1024 } // 2MB
};

// Create upload handlers
const upload = {
  avatar: multer({ storage, fileFilter, limits: limits.avatar }).single('avatar'),
  products: multer({ storage, fileFilter, limits: limits.product }).array('images', 10),
  category: multer({ storage, fileFilter, limits: limits.category }).single('categoryImage'),
  mixed: multer({ storage, fileFilter, limits: limits.default }).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 5 }
  ])
};

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  console.error("multer /file upolad error:",err);
  if (err instanceof multer.MulterError) {

    return res.status(400).json({
      success: false,
      alert: {
        title: 'Error',
        text: err.message === 'File too large' ? 'File size exceeds the 5MB limit.' : 'File upload error.',
        icon: 'error',
      },
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      alert: {
        title: 'Error',
        text: err.message || 'Failed to upload file.',
        icon: 'error',
      },
    });
  }
  next();
};

// Image processing middleware (placeholder for future processing)
const processImage = async (req, res, next) => {
  if (!req.file && !req.files) return next();
  try {
    // Add image processing logic if needed (e.g., resizing)
    next();
  } catch (err) {
    next(err);
  }
};

// Export configuration
module.exports = {
  upload,
  processImage,
  handleMulterError,
  singleUpload: multer({ storage, fileFilter, limits: limits.category }).single('categoryImage'),
  multiUpload: multer({ storage, fileFilter, limits: limits.product }).array('images', 5)
};