
import Order from "../../models/orderSchema.js";
import OrderService  from "../../service/admin/order.service.js";
import { getOrderDetailsService } from "../../service/user/orderDetails.service.js";
export const getOrderAdmin=async(req,res)=>{
    const {
    page = 1,
    search = '',
    status = '',
    sort = 'newest',
    startDate = '',
    endDate = ''
  } = req.query;

  const filters={
    page:parseInt(page),
    search:search.trim(),
    status,
    sort,
    startDate,
    endDate
  }

  const result= await OrderService.getOrders(filters);
   const buildPaginationUrl = (pageNum) => {
    const queryParams = new URLSearchParams({ ...req.query, page: pageNum });
    return `/admin/orders?${queryParams.toString()}`;
  };
res.render('admin/orders', {
    pageTitle: 'Order Management - Chettinad Sarees',
    pageJs: 'admin/order.js',
    layout: false,
    orders: result.orders,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    searchQuery: filters.search,
    statusFilter: status,
    sortOption: sort,
    startDate,
    endDate,
    buildPaginationUrl,
  });

};

export const getOrder=async (req,res)=>{
  const order=await OrderService.getOrderById(req.params.id);
  res.render('admin/order-details',{
    title:'Order Details',
    order,
    layout:false
  })
}

export const updateOrderStatus=async (req,res)=>{
  const{orderId}=req.params;
  const{status}=req.body;

  const result=await OrderService.updateOrderStatus(orderId,status);
  res.json({
    success:true,
    status:result.status,
    statusClass:result.statusClass
  })
}

export const getReturnDetails = async (req, res) => {
  const { orderId } = req.params;
  
  const returnDetails = await OrderService.getReturnDetails(orderId);
  res.json(returnDetails);
};

export const verifyReturnRequest=async(req,res)=>{
  try {
    const {orderId}=req.params;
    const{action,adminNotes,itemIds,rejectReason}=req.body;

    const result=await OrderService.processReturnRequest(
      orderId,
      action,
      {
        adminNotes,
        itemIds:itemIds,
        rejectReason
      }
    );
    res.json({
      success:true,
      result
    });
  } catch (error) {
    res.status(400).json({
      success:false,
      message:error.message
    })
  }
};
export const getOrderDetails=async(req,res)=>{
  try{
  const userId=req.session.user?.id;
  const {orderId}=req.params;
  console.log("userId",userId);
const result=await OrderService.getOrderDetails(orderId);
console.log("orders inside the getOrderDetails",result);

  res.render('admin/orderDetailPage',{
    order:result,
    layout:false
  }
  )
}catch(error){
  console.log('error fetching order details:',error);
  res.status(500).render('admin/admin-error',{
    message:'Internal Server Error',
    layout:false
  })
}

}