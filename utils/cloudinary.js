import {v2 as cloudinary} from "cloudinary";

export const deleteFromCloudinary=async(url,folder="products")=>{
    if(!url) return;
    const publicId=url.split("/").slice(-1)[0].split(".")[0];
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
}