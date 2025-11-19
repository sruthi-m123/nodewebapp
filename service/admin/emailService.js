// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
});

const sendEmailChangeOTP = async (to, otp) => {
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to,
    subject:'Email Change Verification OTP',
    html:`<p>Your OTP for changing email is:<b>${otp}</b></p>`
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmailChangeOTP };
