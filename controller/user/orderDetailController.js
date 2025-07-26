const Order=require('../../models/orderSchema');
const User=require('../../models/userSchema');

const getOrderDetails=async(requestAnimationFrame,res)=>{
    try {
        const userId=requestAnimationFrame.session.user._id;
        const orderId=req.params._id;

const order=await Order.findOne({_id:orderId,userId})
.populate('items.productId')
.lean();

if(!order){
    return res.status(404).render('error',{message:'order not found'})
}
//format data 
const formatItems=order.items.map(item=>({
    ...item,
    name:item.productId.ProductName,
    imageUrl:item.productId.images[0]||'img/admin-workshop',
    color:item.productId.color
}))

    } catch (error) {
        
    }
}