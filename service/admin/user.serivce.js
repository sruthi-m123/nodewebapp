import User from "../../models/userSchema.js";

export const userService={
    async getAllCustomers(search,page,limit){
        const filter={
            isAdmin:false,
            $or:[
                {name:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}}
            ]
        }
const users=await User.find(filter)
.sort({createdAt:-1})
.skip((page-1)*limit)
.limit(limit)
.exec();

const count=await User.countDocuments(filter);
const totalPages=Math.ceil(count/limit);

return {users,count,totalPages};
    },
    
    async updateBlockStatus(userId,isBlocked){
        return await User.findByIdAndUpdate(userId,{isBlocked},{new:true})
    }
}