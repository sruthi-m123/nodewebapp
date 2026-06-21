import User from '../../models/userSchema.js';
import Order from '../../models/orderSchema.js';
import Wallet from '../../models/walletSchema.js';
import Product from '../../models/productSchema.js';
import logger from '../../utils/logger.js';

export class OrderService{
    static async getOrders(filter={}){
        const{
            page=1,
            limit=6,
            search='',
            status='',
            sort='newest',
            startDate='',
            endDate=''
        }=filter;

let userFilter={};

if(search){
    const users=await User.find({
        $or:[
            {name:{$regex:search,$options:'i'}},
            {email:{$regex:search,$options:'i'}}
        ]
    }).select('_id');

    const userIds=users.map(i=>i._id);
    userFilter.userId={$in:userIds};

    if(status){
        userFilter.status={$regex:new RegExp(`^${status}$`,'i')};
    }

    if(startDate||endDate){
        userFilter.createdAt={};
        if(startDate){
            userFilter.createdAt.$gte=new Date(startDate);
        }
        if(endDate){
            const end=new Date(endDate);
            end.setDate(end.getDate()+1);
            userFilter.createdAt.$lte=end;
        }
    }
}
let sortOption={createdAt:-1};
switch(sort){
case 'oldest':
    sortOption={createdAt:1}
    break;
    case 'highest':
        sortOption={total:-1};
        break;
        case 'lowest':
            sortOption={total:1}
            break;
}
logger.info('fetching order with filters',{filters:userFilter,sort:sortOption})

const orders=await Order.find(userFilter)
.populate('userId','name email')
.populate('items.productId','name image')
.sort(sortOption)
.limit(limit)
.skip((page-1)*limit)
.exec();

const totalOrders=await Order.countDocuments(userFilter);
const totalPages=Math.ceil(totalOrders/limit);

const formattedOrders=orders.map(order=>({
   id: order._id,
      user: order.userId.name,
      date: order.createdAt.toISOString().split('T')[0],
      total: order.total,
      status: order.status,
      statusClass: order.status.toLowerCase().replace(/\s+/g, '-'),
      returnRequest: order.returnRequested || false,
      orderId: order.orderId,
      returnItems: order.returnDetails?.items || []
}))

 return {
      orders: formattedOrders,
      totalOrders,
      totalPages,
      currentPage: page
    };

    }

static async getOrderById(orderId){
    logger.info('fetching order by id ',{orderId});

    const order=await Order.findById(orderId)
    .populate('userId' ,'name email')
    .populate('items.productId','name images');

if(!order){
    const error=new Error('Order not found');
    error.code='ORDER_NOT_FOUND';
    throw error;
}

return order;
}

static async updateOrderStatus(orderId,status){
    logger.info('Updating order status',{orderId,status});

    const validStatuses=['pending','shipped','delivered','processing'];

    if(!validStatuses.includes(status)){
        const error=new Error('invaid status');
        error.code='INVALID_STATUS';
        throw error;
    }

    // const updatedOrder=await Order.findByIdAndUpdate(
    //     orderId,
    //     {status},
    //     {new:true},
    //         ).populate('userId','name email');

    //           if (!updatedOrder) {
    //   const error = new Error('Order not found');
    //   error.code = 'ORDER_NOT_FOUND';
    //   throw error;
    // }

    // logger.info('Order status updated successfully', { orderId, newStatus: status });

    //   return {
    //   status: updatedOrder.status,
    //   statusClass: updatedOrder.status.toLowerCase().replace(/\s+/g, '-')
    
    console.log("orderId",orderId);
    const order=await Order.findById(orderId);
    if(!order){
        const error=new Error('Order not found');
        error.code='ORDER_NOT_fOUND';
        throw error;
    }
    const statusFlow=[
        'pending',
        'processing',
        'shipped',
        'delivered'
    ];
    const currentIndex=statusFlow.indexOf(order.status);
    const newIndex=statusFlow.indexOf(status);
    if(currentIndex!==-1 &&
        newIndex!==-1&&
        newIndex<currentIndex
    ){
const error=new Error(
    `Cannot change status from ${order.status}to ${status}`
);
error.code='INVALID_STATUS_TRANSITION';
throw error;
    }

    order.status=status;
    order.items.forEach(item => {
        if (!['cancelled', 'returned', 'return_requested', 'return_rejected', 'partially_cancelled', 'partially_returned'].includes(item.status)) {
            item.status = status;
        }
    });
    if (status === 'processing') {
        order.processingAt = order.processingAt || new Date();
    } else if (status === 'shipped') {
        order.shippedAt = order.shippedAt || new Date();
    } else if (status === 'delivered') {
        order.deliveredAt = order.deliveredAt || new Date();
    }
    await order.save();
    return {
        status:order.status,
        statusClass: order.status.toLowerCase().replace(/\s+/g, '-')    }
}

static async getReturnDetails(orderId){
    logger.info('Fetching return details',{orderId});

    const order=await Order.findOne({orderId}).populate('items.productId');


    if(!order||!order.returnRequested){
             const error = new Error('Return request not found');
      error.code = 'RETURN_REQUEST_NOT_FOUND';
      throw error;
    }

    const {returnDetails}=order;
    console.log("return details:",returnDetails);
    const returnType =
  returnDetails.type ||
  (returnDetails.items?.length > 0 ? 'partial' : 'full');
    logger.debug(`Return details for order ${orderId}`,{returnType,itemsCount:returnDetails.items?.length||0});
   let items=[];
  
    items=returnDetails.items.map(returnItem=>{
        const matchedItem=order.items.map(returnItem=>{
           const matchedItem = order.items.find(i => 
          i.productId.toString() === returnItem.product.toString()
           );
              return {
          _id: returnItem._id,
          name: matchedItem?.name || returnItem.name || 'Unknown Item',
          quantity: matchedItem?.quantity || returnItem.quantity || 0,
          price: matchedItem?.totalPrice || returnItem.price || 'N/A',
          reason: returnItem.reason || 'Not specified',
          status: returnItem.status || matchedItem?.status || 'Pending',
        }; 


        
        })
    })
   
    const globalReason = returnDetails.reason || 
      (returnType === 'partial' ? items[0]?.reason : 'Not specified');

    return {
      reason: globalReason,
      notes: returnDetails.notes || 'None',
      type: returnType,
      totalItems: order.items.length,
      items,
    };
}


static async processReturnRequest(orderId,action,options={}){
    const{adminNotes,ItemsIds,rejectionReason}=options;
    logger.info('processing return request',{orderId,action,ItemsIds});

    const validActions=['approve','reject','reject-all','approve-all'];
  
        if(!validActions.includes(action)){
            const error=new Error ('invalid action');
            error.code='INVALID_ACTION';
            throw error;
        }
        const order=await Order.findOne({orderId:orderId})
        .populate('userId','name email')
        .populate('items.productId','name price stock');

if(!order){
    const error = new Error('Order not found');
      error.code = 'ORDER_NOT_FOUND';
      throw error;
}
    if (!order.returnRequested) {
      const error = new Error('No return request exists for this order');
      error.code = 'NO_RETURN_REQUEST';
      throw error;
    }  

//refund items 
  const refundItems = ItemsIds?.length > 0
      ? order.items.filter(i => ItemsIds.includes(i._id.toString()) && i.status === 'return_requested')
      : order.items.filter(i => i.status === 'return_requested');

 if (refundItems.length === 0) {
      const error = new Error('No eligible items for processing');
      error.code = 'NO_ELIGIBLE_ITEMS';
      throw error;
    }

//refund amount

const couponDiscount=order.appliedCoupon?.value||0;
const deliveryCharge=order.deliveryCharge||0;
const totalPaid=order.total;
let refundAmount=0;

if(totalPaid>0){
    refundItems.forEach(item=>{
        const itemPrice=item.discountedPrice??item.price;
        const itemTotal=itemPrice*item.quantity;
        const itemCouponShare=(itemTotal / totalPaid) * couponDiscount;
         const itemDeliveryShare = (itemTotal / totalPaid) * deliveryCharge;

          refundAmount += itemTotal - itemCouponShare - itemDeliveryShare;
    })
}
    refundAmount = Math.max(refundAmount, 0);

    logger.debug('Refund calculation', { refundAmount, itemsCount: refundItems.length });

let wallet =await Wallet.findOne({user:order.userId})||
new Wallet({user:order.userId,balance:0});

if(action==='approve'||action==='approve-all'){
    await OrderService._processApprovedReturn(order,refundItems,wallet,refundAmount,adminNotes);
}else{
    await OrderService._processRejectedRetrun(order,refundItems,adminNotes,rejectionReason);
}
await OrderService._updateOrderStatus(order,refundItems);
   order.returnDetails.type = refundItems.length === order.items.length ? 'full' : 'partial';

    logger.info('Saving order updates', { orderId, status: order.status });
await order.save();

    if (action.includes('approve')) {
      await wallet.save();
      logger.info('Wallet updated for approved return', { 
        orderId, 
        refundAmount, 
        newBalance: wallet.balance 
      });
    }
        return {
      orderId: order.orderId,
      status: order.status,
      refundAmount: action.includes('approve') ? refundAmount : undefined,
      walletBalance: action.includes('approve') ? wallet.balance : undefined
    };
}
static async _processApprovedReturn(order,refundItems,wallet,refundAmount,adminNotes){
    refundItems.forEach(item=>{
        item.status='returned';
        item.returnDetails={
            status:'completed',
            processDate:new Date(),
            processedBy:'admin',
            notes:adminNotes
        }
    });

    if(refundAmount>0){
        wallet.balance+=refundAmount;
        wallet.transactions.push({
            amount:refundAmount,
            type:'refund',
            order:order._id,
            description:`refund for order #${order.orderId}`,
            reference:`REFUND=${order.orderId}-${Date.now()}`,
            status:'completed'
        });
    }

    //restocking the products
    const restockOps=refundItems.map(item=>
        Product.findByIdAndUpdate(item.productId._id,
            {$inc:{stock:item.quantity}},
            {new:true}
        )
    );
    await Promise.all(restockOps);

    order.returnRequested =false;
    order.returnProcessedAt=new Date();
    order.returnedAt=new Date();
    order.adminNotes=adminNotes||'Returned approved by administrator';
    order.returnDetails.status='completed';

    logger.info('return approved and processed',{
        orderId:order.orderId,
        itemsCount:refundItems.length,
        refundAmount
    })

}

static async _processRejectedReturn(order,refundItems,adminNotes,rejectionReason){
    refundItems.forEach(item=>{
        item.status='return_rejected';
        item.returnDetails={
            status:'rejected',
            processedDate:new Date(),
            processedBy:'admin',
            rejectionReason:rejectionReason||'Not specified',
            notes:adminNotes
            
        }
    });

    order.returnRequested=false;
    order.returnRejectedAt=new Date();
    order.adminNotes=adminNotes||`Return rejected:${rejectionReason||'Not specified'}`;
    order.returnDetails.status='rejected';

    logger.info('return rejected',{
        orderId:order.ordeId,
        itemsCount:refundItems.length,
        rejectionReason
    });
}

static async _updateOrderStatus(order,refundItems){
    const allReturned=order.items.every(i=>i.status==='returned');
    const hasSomeReturned=order.items.some(i=>i.status==='returned');
    const noPendingRequests=order.items.filter(i=>i.status==='return_requested').length===0;

    if(allReturned){
        order.status="returned";
        }else if(hasSomeReturned&&noPendingRequests){
            order.status='partially_returned';

        }else if(noPendingRequests){
            order.status='delivered';
        }else{
            order.status='partially_returned';
        }

        logger.debug('order status updated',{
            orderId:order.orderId,
            newStatus:order.status
        })
}
static async getOrderDetails(orderId){
    console.log("getOrder detail controller ")
    let order=await Order.findOne({orderId}).populate('items.productId');
    console.log("order inside the getOrder details:",order);
    if(!order){
        throw new Error('no order avilable for this Id');
    }
    return order;

}
}

export default OrderService;