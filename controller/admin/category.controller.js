// controllers/admin/category.controller.js
import { categoryService } from "../../service/admin/category.service.js";
import logger from "../../utils/logger.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";
import Product from "../../models/productSchema.js";

const formatResponse = (success, message, data = {}) => ({
  success,
  message,
  ...data
});

export const getAllCategories = async (req, res) => {
  const { search = "", page = 1 } = req.query;
  const { categories, totalCategories, totalPages, skip } = await categoryService.getAll({ search, page });

  res.render('admin/categories', {
    layout: false,
    categories,
    startItem: skip + 1,
    endItem: Math.min(page * 5, totalCategories),
    totalCategories,
    currentPage: page || 1,
    totalPages: totalPages || 1,
    search
  });
};

export const getCategory = async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  if (!category) throw Object.assign(new Error("category not found"), { status: STATUS_CODES.NOT_FOUND });
  res.json(formatResponse(true, "category found", { category }));
};

export const addCategory = async (req, res) => {
  const { name, description } = req.validatedData; 

  const exists = await categoryService.existsByName(name);
  if (exists) throw Object.assign(new Error("category already exists"), { status: STATUS_CODES.CONFLICT }); // Changed to CONFLICT for duplicate

  const imageUrl = req.file?.path || null;
  const category = await categoryService.create({ ...req.validatedData, image: imageUrl });

  logger.info(`New category added: ${category.name}`);
  res.status(STATUS_CODES.CREATED).json(formatResponse(true, "category added successfully", { category }));
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.validatedData; // Destructure from validated body

  const duplicate = await categoryService.existsByName(name, id);
  if (duplicate) throw Object.assign(new Error("category name already exists"), { status: STATUS_CODES.CONFLICT });

  const updateData = { ...req.validatedData };
  if (req.file) {
    const category = await categoryService.getById(id);
    if (category?.image) {
      await deleteFromCloudinary(category.image, "categories");
    }
    updateData.image = req.file.path;
  }

  const updatedCategory = await categoryService.update(id, updateData);
  if (!updatedCategory) throw Object.assign(new Error("category not found"), { status: STATUS_CODES.NOT_FOUND });

  logger.info(`Category updated: ${updatedCategory.name}`); // Fixed typo: updatedCategory
  res.json(formatResponse(true, "category updated successfully", { category: updatedCategory }));
};

export const updateCategoryStatus = async (req, res) => {
  const { categoryId } = req.params;
  const { status } = req.validatedData; // Destructure from validated body
  const validStatus = status === true || status === 'active' ? "active" : "inactive";

  const category = await categoryService.updateStatus(categoryId, validStatus);
  if (!category) throw Object.assign(new Error("category not found"), { status: STATUS_CODES.NOT_FOUND });

  const product = await Product.updateMany({ category: categoryId }, { $set: {
    isActive: validStatus === 'active' ? true : false
  } });

  res.json(formatResponse(true, "status updated successfully", { category, product }));
};

export const deleteCategory = async (req, res) => {
  const category = await categoryService.softDelete(req.params.id);
  if (!category) throw Object.assign(new Error("Category not found"), { status: STATUS_CODES.NOT_FOUND });

  logger.info(`category deleted: ${category.name}`);
  res.json(formatResponse(true, "category deleted successfully"));
};