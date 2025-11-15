import { Category } from "../models/categorySchema.js";
import { Product } from "../models/productSchema.js";

export const categoryService={
    async getAll({search="",page=1,limit=5}){
        const skip=(page-1)*limit;
        const searchFilter={
            isDeleted:false,
            name:{$regex:search,$options:"i"}
        }
const[categories,totalCategories]=await Promise.all([
    Category.find(searchFilter)
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit),
    Category.countDocuments(searchFilter)
])

return{
    categories,
    totalCategories,
    totalPages:Math.ceil(totalCategories/limit),
    skip
}
    },


    async getById(id){
        return await Category.findById(id);
    },

    async create(data){
        return await Category.create(data);
    },
    async update(id,data){
        return await Category.findByIdAndUpdate(id,data,{new:true});
    },
    async updateStatus(categoryId,status){
        return await Category.findByIdAndUpdate(categoryId,{status},{new:true})
    },
    async softDelete(id){
        await Product.updateMany({category:id,isDeleted:false},{isActive:false});
        return await Category.findOneAndUpdate({_id:id,isDeleted:false},{isDeleted:true},{new:true})
    },
    async existsByName(name,excludeId=null){
        const query={
            name:{$regex:new RegExp(`^${name.trim()}$`,"i")},
            isDeleted:false,
        };
        if(excludeId) query._id={$ne:excludeId};
        return await Category.findOne(query);
    }
}