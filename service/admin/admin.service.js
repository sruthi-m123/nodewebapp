import User from "../../models/userSchema.js";
import bcrypt from "bcrypt";

export const findAdminByEmail=async(email)=>{
    return await User.findOne({email,isAdmin:true});
}

export const verifyPassword=async(plainPassword,hashedPassword)=>{
    return await bcrypt.compare(plainPassword,hashedPassword);
}

export const hashPassword=async(password)=>{
    const saltRounds=10;
    return await bcrypt.hash(password,saltRounds);
}