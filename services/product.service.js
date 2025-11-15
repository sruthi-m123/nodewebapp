import { Product } from "../models/productSchema.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

export const productService={

    async getAll({search,page,limit=10}){
        const skip=(page-1)*limit;
        const filter=search?{productName:{$regex:search,$options:"i"}}:{};
        const [products,totalProducts]=await Promise.all([
            Product.find(filter)
            .populate("category")
            .sort(skip)
            .limit(limit),
            Product.countDocuments(filter)
        ]);
        return{products,totalProducts,totalPages:Math.ceil(totalProducts/limit),skip}
    },

    async create(data,files){
        const imageUrls=[];
        if(files?.length){
            for(const file of files){
            imageUrls.push(file.path);
         
        }
    }
    const product= new  Product({...data,images:imageUrls})
    return product.save()
    },

async update(id,data,files,removedImages){
    const product=await Product.findById(id);
    if(!product)return null;
    let updatedImages=[...product.images];
    if(removedImages?.length){
        for(const img of removedImages){
            await deleteFromCloudinary(img);
            updatedImages=updatedImages.filter((i)=>i!==img);
        }
    }

if(files?.length){
    for(const file of files){
        updatedImages.push(file.path)
    }
}
data.images=updatedImages;
return Product.findByIdAndUpdate(id,data,{new:true});
},

async delete(id){
    const product=await Product.findById(id);
    if(!product)return null;

   await Product.findByIdAndUpdate({isDelete:false})
   return product
},

async updateProductStatus(id,isActive){
    return Product.findByIdAndUpdate(id,{isActive},{new:true})
},

async getById(id){
    return Product.findById(id).populate("category");
},
async existsByName(name){
    return Product.findOne({productName:{$regex:`^${name}$`,$options:"i"}})
}



}
























