const User = require("../../models/userSchema");
const Address=require("../../models/addressSchema");
 
const getAddressPage = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch basic user details
    const user = await User.findById(userId).lean();
console.log("reached address page")
    // Check if address already exists
    let addressDoc = await Address.findOne({ userId }).lean();
console.log("addressDoc:",addressDoc)
      
    res.render("user/address", {
 pageCSS: "user/address.css",
      pageJS:"user/address.js",
            user: {
        ...user,
        addresses: addressDoc?.address || [],
      },
      activeTab: "addresses"
    });

  
}catch (error) {
    console.error("Error loading address page:", error);
    res.status(500).send("Server error");
  }
};

 const addAddress=async(req,res)=>{
    try {
        const userId=req.session.user._id;
        console.log("body:",req.body);
        const {
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
        }=req.body;

if(!name||!addressType||!city||! state||!pincode||!phone||!building){
    return res.status(400).send("please fill all requires fileds ")
}

if(!/^\d{10}$/.test(phone)){
    return res.status(400).send("phone number must be 10 digits.")
}

if (altPhone && !/^\d{10}$/.test(altPhone)) {
      return res.status(400).send("Alternate phone must be 10 digits.");
    }

 if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).send("Pincode must be 6 digits.");
    }   
    const validTypes = ["Home", "Work", "Other"];
    if (!validTypes.includes(addressType)) {
      return res.status(400).send("Invalid address type.");
    }

//new address object
const newAddress={
    addressType,
    name,
    city,
    building,
    landmark,
    state,
    pincode,
    phone,
    altPhone,
    isDefault:!!setAsDefault

}
console.log("new adress:",newAddress)
let userAddressDoc=await Address.findOne({userId})

if(!userAddressDoc){
    newAddress.isDefault=true;

    await Address.create({
        userId,address:[newAddress]
    });
}else{
    if(newAddress.isDefault){
        userAddressDoc.address.forEach(addr=>addr.isDefault=false)
    }

    userAddressDoc.address.push(newAddress);
    await userAddressDoc.save();
}
res.status(200).json({ success: true, message: "Saved successfully" });
 }catch(err){
    console.error("Error adding address:", err);
    res.status(500).send("Internal Server Error");
 }
}

 const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;
    
   const updatedDoc= await Address.findOneAndUpdate(
      { userId },
      { $pull: { address: { _id: addressId } } },
      {new:true}
    );
    if (updatedDoc && updatedDoc.address.length > 0 && !updatedDoc.address.some(a => a.isDefault)) {
      updatedDoc.address[0].isDefault = true;
      await updatedDoc.save();
    }
res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).send('Server error');
  }
}

 const getEditAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;
    
    const addressDoc = await Address.findOne(
      { userId, "address._id": addressId },
      { "address.$": 1 }
    );
    
    if (!addressDoc || !addressDoc.address.length) {
      return res.status(404).send('Address not found');
    }
    res.json({ success: true, address: addressDoc.address[0] });
   
  } catch (err) {
    console.error('Error loading edit address page:', err);
    res.status(500).send('Server Error');
  }
}

const updateAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;
    const updates = req.body;
    
    await Address.updateOne(
      { userId, "address._id": addressId },
      { $set: {
        "address.$.name": updates.name,
        "address.$.building":updates.building,
        "address.$.addressType": updates.addressType,
        "address.$.city": updates.city,
        "address.$.landmark": updates.landmark,
        "address.$.state": updates.state,
        "address.$.pincode": updates.pincode,
        "address.$.phone": updates.phone,
        "address.$.altPhone": updates.altPhone
      }}
    );
    
    res.status(200).json({success:true,message:"Address updated succesfully"});
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).send('Server error');
  }
}
const setDefaultAddress=async(req,res)=>{
  console.log("session check:",req.session.user)
      const userId=req.session.user._id;
      console.log("session id:",userId)
        const addressId=req.params.id;
if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No session found' });
  }

    try{ 
      const userAddressDoc=await Address.findOne({userId});
      if(!userAddressDoc) return res.status(404).send("no addresses found ");
        
      userAddressDoc.address.forEach(addr=>{
        addr.isDefault=addr._id.toString()===addressId;
      })
await userAddressDoc.save();
res.json({ message: "Default address set successfully" });

    } catch(err){
          console.error("Failed to set default address:", err);
    res.status(500).send("Internal Server Error");
    }
}

 module.exports={
    getAddressPage,
    addAddress,
    deleteAddress,
    getEditAddress,
    updateAddress,
    setDefaultAddress
 }
