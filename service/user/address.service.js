import User from "../../models/userSchema.js";
import Address from "../../models/addressSchema.js";
import logger from "../../utils/logger.js";

export const getUserAddressesService=async(userId)=>{
    logger.debug('fetching user address',{userId});

    const user =await User.findById(userId).lean();
    const addressDoc= await Address.findOne({userId}).lean();

    const filteredAddresses=addressDoc?.address.filter(a=>!a.isDeleted)||[];
    logger.info('User address fetched successfully',{
        userId,
        addressCount:filteredAddresses.length
    });
    return{
        user:{
            ...user,
            addresses:filteredAddresses
        }
    }
}

export const addAddressService=async(userId,addressData)=>{
    console.log("reaching the address service ");
    const{
        name,
        addressType,
        city,
        building,
        landmark,
        state,
        pincode,
        phone,
        altPhone,
        setAsDefault
    }=addressData;
    console.log("addressType:",addressType);
    logger.debug('adding new address',{userId,addressType});
    const newAddress={
        addressType:addressType,
        name,
        city,building,landmark,state,pincode,phone,altPhone,
        isDefault:!!setAsDefault
    }
let userAddressDoc=await Address.findOne({userId});
console.log("userAddressDoc",userAddressDoc);
if(!userAddressDoc){
    console.log("hi inside new addresss");
    newAddress.isDefault=true;
    await Address.create({
        userId,
        address:[newAddress]
    })
    logger.info('firts address created for user',{userId});
}else{
    if(newAddress.isDefault){
        userAddressDoc.address.forEach(addr=>(addr.isDefault=false));
    }
    userAddressDoc.address.forEach(addr=>{
        addr.addressType=addr.addressType.toLowerCase();
    })
    userAddressDoc.address.push(newAddress);
    await userAddressDoc.save();
    logger.info('New address added to existing addresses',{userId});
}

return {message:"saved successfully"};

}

export const deleteAddressService=async(userId,addressId)=>{
    logger.debug('soft deleting address',{userId,addressId});

    const updatedDoc=await Address.findOneAndUpdate({
        userId,"address._id":addressId
    },{
        $set:{
            "address.$.isDeleted":true,
            "address.$.deletedAt":new Date()
        }
    },{new:true}
);
if(updatedDoc){
    const defaultAddress=updatedDoc.address.find(addr=>
        !addr.isDeleted&&addr.isDefault
    );
    if(!defaultAddress && updatedDoc.address.some(addr=>!addr.isDeleted)){
        await Address.findOneAndUpdate(
        { userId, "address._id": updatedDoc.address.find(addr => !addr.isDeleted)._id },
        { $set: { "address.$.isDefault": true } }
      );
      logger.debug('new default address set after deletion',{userId});
    }
}
logger.info('address soft deleted successfully',{userId,addressId});
return {message:"address deleted successfully"};
}

export const getEditAddressService= async (userId,addressId)=>{
    logger.debug('fetching address for edit',{userId,addressId});
    const addressDoc=await Address.findOne({userId,"address._id":addressId},{"address.$":1});

    if(!addressDoc||!addressDoc.address.length){
        logger.warn('Address not found for editing',{userId,addressId});
        throw new Error('Address not found');
    }
    logger.debug('Adrress fetched successfully for editing',{userId,addressId});
    return {address:addressDoc.address[0]};
}


export const updateAddressService = async (userId, addressId, updates) => {
  logger.debug('Updating address', { userId, addressId, updates });
 console.log('userId',userId);
 console.log('addressId',addressId);
 console.log("updates:",updates);
  
  const result = await Address.updateOne(
    { userId, "address._id": addressId, "address.isDeleted": false },
    {
      $set: {
        "address.$.name": updates.name,
        "address.$.building": updates.building,
        "address.$.addressType": updates.addressType,
        "address.$.city": updates.city,
        "address.$.landmark": updates.landmark,
        "address.$.state": updates.state,
        "address.$.pincode": updates.pincode,
        "address.$.phone": updates.phone,
        "address.$.altPhone": updates.altPhone,
      },
    }
  );

  if (result.modifiedCount === 0) {
    logger.warn('Address not found or no changes applied during update', { userId, addressId });
    throw new Error('Address not found or no changes applied');
  }

  logger.info('Address updated successfully', { userId, addressId });
  return { message: "Address updated successfully" };
};

export const setDefaultAddressService = async (userId, addressId) => {
  logger.debug('Setting default address', { userId, addressId });
  
  const userAddressDoc = await Address.findOne({ userId });
  
  if (!userAddressDoc) {
    logger.warn('No addresses found for user', { userId });
    throw new Error('No addresses found');
  }
  
  userAddressDoc.address.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId;
  });
  
  await userAddressDoc.save();
  
  logger.info('Default address set successfully', { userId, addressId });
  return { message: "Default address set successfully" };
};