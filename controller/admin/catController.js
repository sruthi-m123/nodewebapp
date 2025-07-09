const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const fs = require('fs');
const formatResponse = (success, message, data = {}) => ({
  success,
  alert: { title: success ? 'Success' : 'Error', text: message, icon: success ? 'success' : 'error' },
  ...data,
});

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, categories.length);
    const totalCategories = categories.length;
    const totalPages = Math.ceil(totalCategories / limit);

    res.render('admin/categories', {
      layout:false,
      categories,
      startItem,
      endItem,
      totalCategories,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json(formatResponse(false, 'Error fetching categories'));
  }
};

// Get a single category by ID
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json(formatResponse(false, 'Error fetching category'));
  }
};

// Add a new category
const addCategory = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json(formatResponse(false, req.fileValidationError.message));
    }

    const { name,  description, status} = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json(formatResponse(false, 'Category name is required'));
    }

    const existingCategory = await Category.findOne({ name: name.trim().toLowerCase() });
    if (existingCategory) {
      return res.status(400).json(formatResponse(false, 'Category with this name already exists'));
    }

    let imagePath = '';
    if (req.file) {
      imagePath = `/img/admin/category/${req.file.filename}`;
      console.log('Image saved from file upload:', imagePath);
    }
    

    const newCategory = new Category({
      name: name.trim().toLowerCase(),
     
      description: description || '',
      status: status || 'active',
      image: imagePath,
    });
    await newCategory.save();
    console.log('saved category:',newCategory)
    return res.status(201).json(formatResponse(true, 'Category added successfully'));
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json(formatResponse(false, error.message || 'Error adding category'));
  }
};
// Update category status
const updateCategoryStatus = async (req, res) => {
  try {
    
    const { categoryId } = req.params; // Use categoryId from params
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        alert: { title: 'Validation Error', text: 'Invalid status value', icon: 'error' },
      });
    }

    // Update category status
    const category = await Category.findByIdAndUpdate(
      categoryId, // Use categoryId instead of req.params.id
      { status },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        alert: { title: 'Not Found', text: 'Category not found', icon: 'error' },
      });
    }

    res.json({
      success: true,
      alert: { title: 'Success', text: 'Status updated successfully', icon: 'success' },
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      alert: { title: 'Server Error', text: error.message || 'Error updating status', icon: 'error' },
    });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json(formatResponse(false, req.fileValidationError.message));
    }
    const { name,  description, status } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json(formatResponse(false, 'Category name is required'));
    }

    const updateData = {
      name: name.trim().toLowerCase(),
      
      description: description || '',
      status: status || 'active',
    };

    if (req.file) {
      updateData.image = `/img/admin/category/${req.file.filename}`;
    } else {
      const existingCategory = await Category.findById(req.params.id);
      if (existingCategory) {
        updateData.image = existingCategory.image; // Retain existing image
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) {
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }
    return res.json(formatResponse(true, 'Category updated successfully', { category }));
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json(formatResponse(false, error.message || 'Error updating category'));
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json(formatResponse(false, 'Category ID is required'));
    }

    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
      return res.status(400).json(formatResponse(false, `Cannot delete category with ${productCount} associated products`));
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json(formatResponse(false, 'Category not found'));
    }
    return res.json(formatResponse(true, 'Category deleted successfully'));
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json(formatResponse(false, error.message || 'Error deleting category'));
  }
};

module.exports = {
  getAllCategories,
  getCategory,
  addCategory,
  updateCategoryStatus,
  updateCategory,
  deleteCategory,
};