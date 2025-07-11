const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const fs = require('fs');
const path = require('path');

const formatResponse = (success, message, data = {}) => ({
  success,
  message,
  ...data
});

const getAllCategories = async (req, res) => {
  try {
    const search=req.query.search||'';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const [categories, totalCategories] = await Promise.all([
      Category.find({ isDeleted: false })
        .sort({ createdAt: -1 })  
        .limit(limit),
      Category.countDocuments({ isDeleted: false })
    ]);

    const startItem = skip + 1;
    const endItem = Math.min(page * limit, totalCategories);
    const totalPages = Math.ceil(totalCategories / limit);

    res.render('admin/categories', {
      layout: false,
      categories,
      startItem,
      endItem,
      totalCategories,
      currentPage: page,
      totalPages,
      search
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).render('admin/error', {
      layout: false,
      message: 'Error loading categories'
    });
  }
};

// Get category details (for edit)
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    console.log("Category details editing:",category)
    if (!category) {
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }
    res.json(formatResponse(true, 'Category found', { category }));
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

// Add new category with enhanced image validation
const addCategory = async (req, res) => {
  try {
    // Validate input
    if (req.fileValidationError) {
      return res.status(400).json(formatResponse(false, req.fileValidationError));
    }

    const { name, description, status = 'active' } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json(formatResponse(false, 'Category name is required'));
    }

    // Check for duplicate
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isDeleted: false
    });

    if (existingCategory) {
      // If there was a file uploaded but validation failed, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json(formatResponse(false, 'Category already exists'));
    }

    // Handle image upload with validation
    let imagePath = '';
    if (req.file) {
      // Verify the file was actually saved
      if (!fs.existsSync(req.file.path)) {
        return res.status(500).json(formatResponse(false, 'Failed to save category image'));
      }
      
      // Validate image file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path); // Remove invalid file
        return res.status(400).json(formatResponse(false, 'Only JPEG, PNG, and GIF images are allowed'));
      }

      imagePath = path.join('/img/admin/category', req.file.filename);
    }
console.log(req.body); // Log text fields
console.log(req.file); //debuging
    // Create new category
    const newCategory = new Category({
      name: name.trim(),
      description: description || '',
      status,
      image: imagePath
    });

    await newCategory.save();
console.log("category saved");
    res.status(201).json(formatResponse(true, 'Category added successfully', { 
      category: newCategory 
    }));
  } catch (error) {
    // Clean up uploaded file if something went wrong
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error adding category:', error);
    res.status(500).json(formatResponse(false, 'Failed to add category'));
  }
};

// Update category status
const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json(formatResponse(false, 'Invalid status value'));
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!category) {
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }

    res.json(formatResponse(true, 'Status updated successfully', { category }));
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json(formatResponse(false, 'Failed to update status'));
  }
};

// Update category with improved image handling
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status = 'active' } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json(formatResponse(false, 'Category name is required'));
    }

    // Check for duplicate 
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isDeleted: false
    });

    if (existingCategory) {

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json(formatResponse(false, 'Category name already exists'));
    }

    const updateData = {
      name: name.trim(),
      description: description || '',
      status
    };

    // Handle image upload
    if (req.file) {
      // Validate image file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path); // Remove invalid file
        return res.status(400).json(formatResponse(false, 'Only JPEG, PNG, and GIF images are allowed'));
      }

      // Verify the file was actually saved
      if (!fs.existsSync(req.file.path)) {
        return res.status(500).json(formatResponse(false, 'Failed to save category image'));
      }

      // Delete old image if exists
      const oldCategory = await Category.findById(id);
      if (oldCategory && oldCategory.image) {
        const oldImagePath = path.join(__dirname, '../../public', oldCategory.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = path.join('/img/admin/category', req.file.filename);
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!category) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }

    res.json(formatResponse(true, 'Category updated successfully', { category }));
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error updating category:', error);
    res.status(500).json(formatResponse(false, 'Failed to update category'));
  }
};

// Delete category (soft delete)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;

    const productCount = await Product.countDocuments({ 
      category: id,
      isDeleted: false 
    });

    if (productCount > 0) {
      return res.status(400).json(
        formatResponse(false, `Cannot delete: ${productCount} products exist in this category`)
      );
    }

    // Soft delete
    const category = await Category.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!category) {
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }

    res.json(formatResponse(true, 'Category deleted successfully'));
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json(formatResponse(false, 'Failed to delete category'));
  }
};

module.exports = {
  getAllCategories,
  getCategory,
  addCategory,
  updateCategoryStatus,
  updateCategory,
  deleteCategory
};