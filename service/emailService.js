import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD, // App password
  },
  tls: {
    rejectUnauthorized: false // production safe
  }
});

// Verify transporter once at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error.message);
  } else {
    console.log('✅ Email server ready to send mails');
  }
});

export const sendEmailChangeOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Your App Name" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: 'OTP for Email Change',
      html: `
        <h2>Email Change Request</h2>
        <p>Your OTP for changing email is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `
    });

    logger.info('Email change OTP sent', { email });
    return true;
  } catch (error) {
    logger.error('Failed to send email OTP', { error: error.message });
    throw new Error(MESSAGES.EMAIL.SEND_FAILED);
  }
};

export const sendVerificationEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: 'Verify your account',
      html: `<b>Your OTP: ${otp}</b>`
    });
console.log("otp:",otp);
console.log("info:",info);
    return info.accepted.length > 0;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    return false;
  }
};
