const Product = require(`../../models/productSchema`);
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Category = require("../../models/categorySchema");
const sharp = require("sharp");
const renderProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
       
    const searchQuery = req.query.search?.trim() || '';
        const searchFilter = searchQuery
  ? { productName: { $regex: searchQuery, $options: 'i' } }
  : {};
                     
        
    
    const filter = { isDeleted: false, ...searchFilter };
    const products = await Product.find(filter)
      .populate("category")
      .sort({createdAt:-1})
      .skip(skip)
      .limit(limit);
    const categories = await Category.find();

      
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    res.render("admin/products", {
      layout:false,
      category: categories,
      products,
      currentPage: page,
      totalPages: totalPages,
      search:searchQuery
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const addProduct = async (req, res) => {
  try {
    console.log('Received data:', req.body);
    console.log('Received files:', req.files);
    console.log('Total uploaded images received:', req.files ? req.files.length : 0);

    const imagePaths = req.files
      ? req.files.map(file => file.path.replace(/\\/g, '/').replace('public/', ''))
      : [];

    if (imagePaths.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }
const isNewArrival = req.body.isNewArrival === 'true' || req.body.isNewArrival === true || req.body.isNewArrival === 'on';
const isActive = req.body.isActive === 'true' || req.body.isActive === true;
  const productName = req.body.productName ? req.body.productName.trim() : '';
const existingProduct = await Product.findOne({
      productName: { $regex: `^${productName}$`, $options: 'i' } 
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }
    const sku = req.body.sku ? req.body.sku.trim() : '';
if (!sku) {
  return res.status(400).json({ success: false, message: 'SKU is required' });
}

    const productData = {
      productName: req.body.productName,
      category: req.body.category, 
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      color: req.body.color,
      images: imagePaths,
      isNewArrival,
      isActive,
      sku
    };

    console.log('Product data before saving to db:', productData);
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    res.json({ success: true, product: savedProduct });
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      categoryName,
      description,
      price,
      stock,
      color,
      removedImages
    } = req.body;

if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
      return res.status(400).json({ success: false, message: 'Invalid price or stock value' });
    }

 const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
const isNewArrival = req.body.isNewArrival === 'true' || req.body.isNewArrival === true || req.body.isNewArrival === 'on';
const isActive = req.body.isActive === 'true' || req.body.isActive === true;

    const updateData = {
      productName,
      categoryName,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      color,
      isNewArrival,
      isActive
    };

  
 
let updatedImages=[...existingProduct.images];
if (removedImages) {
      const imagesToRemove = JSON.parse(removedImages);
      imagesToRemove.forEach(imagePath => {
        updatedImages = updatedImages.filter(img => img !== imagePath);
//delete file from the disk
        const fullPath = path.join(__dirname, '../public', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
//adding newly uploaded images 
if (req.files && req.files.length > 0) {
  const newImages = req.files.map(file =>
    file.path.replace(/\\/g, '/').replace('public/', '')
  );
  updatedImages = [...updatedImages, ...newImages];
}
updateData.images = updatedImages;
  

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

      res.json({ success: true, product: updatedProduct });
   
  } catch (error) {
    console.error(error);
      res.status(500).json({ success: false, message: error.message });
    
  }
};



const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
await Product.findByIdAndUpdate(id, { isDeleted: true });

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      res.json({ success: true, message: "Product deleted successfully" });
    } else {
      req.flash("success", "Product deleted successfully");
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.error(error);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      req.flash("error", "Failed to delete product");
      res.redirect("/admin/products");
    }
  }
};


const updateProductStatus=async (req,res)=>{
  const{productId}=req.params;
  const{isActive}=req.body;
  try{
    const updated =await Product.findByIdAndUpdate(productId,{isActive},{new:true});
    if(!updated){
      return res.status(404).json({success:false,message:'product not found'});
    }
    res.json({success:true,message:'Status updated successfully'});
  }catch(err){
    console.error('Updated error:',err);
    res.status(500).json({success:false,message:'server error'})
  }
}
const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json(product); 
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  renderProducts,
  addProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getProductDetails
  
};
