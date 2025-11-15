import { categoryService } from "../../services/category.service.js";
import logger from "../../utils/logger.js";
import { categorySchema,categoryStatusSchema } from "../../utils/validation.schema.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

const formatResponse = (success, message, data = {}) => ({
  success,
  message,
  ...data
});

export const getAllCategories = async (req, res) => {
const {search="",page=1}=req.query;
const {categories,totalCategories,totalPages,skip}=await categoryService.getAll({search,page});
    
    res.render('admin/categories', {
      layout: false,
      categories,
      startItem:skip+1,
      endItem:Math.min(page*5,totalCategories),
      totalCategories,
      currentPage: page||1,
      totalPages:totalPages||1,
      search
    });
  } 

// Get category details (for edit)
export const getCategory=async (req,res)=>{
  const category=await categoryService.getById(req.params.id);
  if(!category) throw Object.assign(new Error("category not found"),{status:STATUS_CODES.NOT_FOUND});
  res.json(formatResponse(true,"category found",{category}))
}


export const addCategory = async (req, res) => {
const {error,value}=categorySchema.validate(req.body);
if(error)throw Object.assign(new Error(error.message),{status:STATUS_CODES.BAD_REQUEST})

  const exists=await categoryService.existsByName(value.name);
if(exists) throw Object.assign(new Error("category already exists"),{status:STATUS_CODES.NOT_FOUND})
   
 const imageUrl=req.file?.path||null;
 const category=await categoryService.create({...value,image:imageUrl});

 logger.info(`New category added:${category.name}`);
 res.status(STATUS_CODES.CREATED).json(formatResponse(true,"category added successfully",{category}))
          
};

// Update category 
export const updateCategory = async (req, res) => {
 
    const { id} = req.params;
   

const{error,value}=categorySchema.validate(req.body);
if(error)throw Object.assign(new Error (error.message),{status:STATUS_CODES.NOT_FOUND})

const duplicate=await categoryService.existsByName(value.name,id);
if(duplicate) throw Object.assign(new Error("category name already exists"),{status:STATUS_CODES.NOT_FOUND})

const updateData={...value};
if(req.file){
   const category = await categoryService.getById(id);
  if(category?.image){
    await deleteFromCloudinary(category.image,"categories")
  }
   updateData.image=req.file.path;
}

const updatedCategory=await categoryService.update(id,updateData);
if(!updatedCategory) throw Object.assign(new Error("category not found"),{status:STATUS_CODES.NOT_FOUND})

  logger.info(`Category updated:${updateCategory.name}`)
res.json(formatResponse(true,"category updated successfully",{category:updatedCategory}))
};
// update cateory status
export const updateCategoryStatus=async(req,res)=>{
const {error,value}=categoryStatusSchema.validate(req.body);
if(error) throw Object.assign(new Error(error.message),{status:STATUS_CODES.BAD_REQUEST});

const {categoryId}=req.params;
const validStatus=value.status===true||value.status==='active'?"active":"inactive";

const category=await categoryService.updateStatus(categoryId,validStatus);
if(!category) throw Object.assign(new Error("category not found"),{status:STATUS_CODES.NOT_FOUND});
res.json(formatResponse(true,"status updated successfully",{category}));
}

//delete category

export const deleteCategory=async(req,res)=>{
  const category=await categoryService.softDelete(req.params.id);
 if (!category) throw Object.assign(new Error("Category not found"), { status: STATUS_CODES.NOT_FOUND});

 logger.info(`category deleted:${category.name}`);
 res.json(formatResponse(true,"category deleted successfully"))
}



