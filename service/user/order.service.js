import Order from '../../models/orderSchema.js';
import logger from '../../utils/logger.js';

export const getOrderHistoryService=async(userId,filters={})=>{
    const {
        page=1,
        limit=6,
        search='',
            }=filters;
            const skip=(page-1)*limit;
            logger.debug('fetching order history',{userId,page,limit,search});
            let orderFilter={userId};
            if(search){
                const regex=new RegExp(search,'i');
                orderFilter={
                    userId,
                    $or:[
                        {orderId:{$regex:regex}},
                        {'items.name':{$regex:regex}},
                        {'items.productId.name':{$regex:regex}}
                    ]
                }
            }

            const totalOrders=await Order.countDocuments(orderFilter);
            const totalPages=Math.ceil(totalOrders/limit);

            const orders=await Order.find(orderFilter)
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
            .populate("items.productId")
            .lean();

            logger.info('orders fetched succcessfully',{
                userId,
                orderCount:orders.length,
                totalPages
            })
            return{
                orders,
                totalOrders,
                totalPages,
                currentPage:page
            }
}

export const formatOrderHistoryService=(orders)=>{
    logger.debug('formating order history data');

    const formattedOrders=orders.map(order=>{
        const firstItem=order.items[0];
        const product=firstItem?.productId;

        const deliveryDate=new Date(order.createdAt.getTime()+5*24*60*60*1000);

        return {
                id: order.orderId,
            orderNumber: order.orderId,
            price: order.total,
            deliveryDate: deliveryDate.toDateString(),
            imageUrl: product?.images?.[0] || '/img/admin-products.png',
            productName: firstItem?.name || product?.productName || 'Product',
            variant: firstItem?.variant || 'Default',
            quantity: firstItem?.quantity || 1,
            status: order.status || 'pending',
            createdAt: order.createdAt,
            itemsCount: order.items.length,
            totalAmount: order.total
        }
    });
      logger.debug('Order history formatted', { formattedCount: formattedOrders.length });
    return formattedOrders;  
}
