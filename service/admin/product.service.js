import { Product } from "../../models/productSchema.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

export const productService={

    async getAll({search,page,limit=10}){
        const skip=(Math.max(1,parseInt(page))-1)*parseInt(limit);
const filter={
    isDeleted:false,
    ...(search&&{
        productName:{$regex:search,$options:"i"}
    })
}

        const [products,totalProducts]=await Promise.all([
            Product.find(filter)
            .populate("category")
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit),
            Product.countDocuments(filter)
        ]);
        console.log("products :",products);
        return{products,totalProducts,totalPages:Math.ceil(totalProducts/limit),skip}
    },
async create(data = {}, files = []) {
    
console.log("data being here :",data );
let imageUrls = [];
if (Array.isArray(files) && files.length) {
for (const file of files) {
if (file?.path) imageUrls.push(file.path);
}
}
 if (!imageUrls.length && Array.isArray(data.images)) {
    imageUrls = data.images;
  }
const {sku}=data;
const existing=await Product.findOne({sku});

if(existing && existing.isDeleted){
    existing.set({
        ...data,
        images:imageUrls.length?imageUrls:existing.images,
        isDeleted:false,
        isActive:true,
        isBlocked:false
    });
    await existing.save();
    return {type:"RESTORED",product:existing};
}

if(existing && !existing.isDeleted){
    return {message:"the product is already existing "}
}

const product = new Product({ ...data, images: imageUrls });
await product.save();
return {type:"CREATED",product};
},

async update(id,data={},files=[],removedImages=[]){
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

    if(product.isDeleted) return product;


   const updatedProduct=await Product.findByIdAndUpdate(id,{isActive:false,isDeleted:true},{new :true})
   return updatedProduct;
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
























