import { userService } from "../../service/admin/user.serivce.js";
import logger from "../../utils/logger.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";

const formatResponse = (success, message, data = {}) => ({
  success,
  message,
  ...data
});
export const customerInfo=async (req,res)=>{
  const search=req.query.search?.trim()||"";
  const page=Math.max(parseInt(req.query.page)||1,1);
  const limit=6;
  logger.info(`fetcing users | page:${page},search:"${search}"`);

  const{users,count,totalPages}=await userService.getAllCustomers(search,page,limit);

  if(page>totalPages && totalPages>0){
     logger.warn(`Page ${page} exceeds total pages (${totalPages}) — redirecting.`);
    return res.redirect(`/admin/users?page=${totalPages}&search=${search}`);
  }
  res.render("admin/users",{
    layout:false,
    users,
    totalPages,
    currentPage:page,
    search,
    count,
    pageCSS:"/css/admin/users.css",
    pageScript:"/js/admin/users.js"
  })
}
export const toggleBlockStatus=async(req,res)=>{
  const {userId,isBlocked}=req.body;
  
  const updatedUser=await userService.updateBlockStatus(userId,isBlocked);
  if(!updatedUser){
    throw Object.assign(new Error("User not found"), { status: STATUS_CODES.NOT_FOUND });

  }
   logger.info(`User ${updatedUser.name} (${updatedUser._id}) ${isBlocked ? "blocked" : "unblocked"}`);
   res
    .status(STATUS_CODES.SUCCESS)
    .json(formatResponse(true, `User ${isBlocked ? "blocked" : "unblocked"} successfully`, { updatedUser }));
}

