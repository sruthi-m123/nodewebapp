import Joi from "joi";

export const verifyOtpSchema = Joi.object({
    enteredOtp: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
        'string.pattern.base': 'OTP must be 6 digits',
        'string.empty': 'OTP is required'
    })
})
