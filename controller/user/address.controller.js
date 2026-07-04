import * as addressService from "../../service/user/address.service.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { MESSAGES } from "../../utils/messages.js";
import logger from "../../utils/logger.js";


logger.debug("Available addressService functions", Object.keys(addressService))
export const getAddressPage = async (req, res) => {
  logger.info('loading address page');
  if (!req.session.user) {
    logger.warn('unauthorized access to address page- no session');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      message: MESSAGES.ADDRESS.LOGIN_REQUIRED
    });
  }

  const userId = req.session.user.id;
  const data = await addressService.getUserAddressesService(userId);

  res.render("user/address", {
    pageCSS: "user/address.css",
    pageJS: "user/address.js",
    user: data.user,
    activeTab: "addresses"
  })
}

export const addAddress = async (req, res) => {
  console.log("inside the address controller")
  const userId = req.session.user.id;
  if(!userId){
    return res.status(404).json({success:false,message:"please login to continue ."})
  }
  logger.info('Adding new address', { userId });
  const value = req.validatedData;
  console.log("value inside the address controller:",value);
  const result = await addressService.addAddressService(userId, value);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.ADDRESS.ADD_SUCCESS,
    data: result
  })
}

export const deleteAddress = async (req, res) => {
  const userId = req.session.user.id;
  const addressId = req.params.id;

  logger.info('Deleting address', { userId, addressId });
  await addressService.deleteAddressService(userId, addressId);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.ADDRESS.DELETE_SUCCESS
  })
}

export const getEditAddress = async (req, res) => {
  const userId = req.session.user.id;
  const addressId = req.params.id;

  logger.info('Fetching address for edit', { userId, addressId });
  const data = await addressService.getEditAddressService(userId, addressId);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    address: data.address
  })
}

export const updateAddress = async (req, res) => {
  const userId = req.session.user.id;
  const addressId = req.params.id;

  logger.info('updating address', { userId, addressId });

  const value = req.validatedData;

  await addressService.updateAddressService(userId, addressId, value);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.ADDRESS.UPDATE_SUCCESS
  })
}

export const setDefaultAddress = async (req, res) => {
  const userId = req.session.user.id;
  const addressId = req.params.id;
  logger.info('setting default address', { userId, addressId });
  if (!userId) {
    logger.warn('Unauthorized attempt to set default address');
    return res.status(STATUS_CODES.UNAUTHORIZED).json(MESSAGES.LOGIN_REQUIRED);

  }
  await addressService.setDefaultAddressService(userId, addressId);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.ADDRESS.SET_DEFAULT_SUCCESS
  })
}