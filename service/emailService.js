import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';
const transporter= nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASS
    }
});
export const sendEmailChangeOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"Your App Name" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'OTP for Email Change',
            html: `
                <h2>Email Change Request</h2>
                <p>Your OTP for changing email is:</p>
                <h1>${otp}</h1>
                <p>This OTP is valid for 5 minutes.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        logger.info('Email change OTP sent', { email });
    } catch (error) {
        logger.error('Failed to send email OTP', { error: error.message });
        throw new Error(MESSAGES.EMAIL.SEND_FAILED);
    }
};

export const sendVerificationEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Verify your account',
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error('Error sending email', error); 
    return false;
  }
};
