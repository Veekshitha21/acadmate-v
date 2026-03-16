// Email Service - Send OTP emails using Hostinger SMTP
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter using Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,   // acadmate@acadmate.eu
    pass: process.env.EMAIL_PASS,   // mailbox password
  },
});

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"AcadMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "AcadMate - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #fbf9f1;">
          <div style="background-color: white; padding: 30px; border-radius: 10px;">
            <h1 style="color:#f4b30c; text-align:center;">AcadMate</h1>
            <h2>Email Verification</h2>

            <p>
              Thank you for registering with AcadMate. 
              Please use the OTP below to verify your email.
            </p>

            <div style="background:#f4b30c; padding:20px; text-align:center; border-radius:8px;">
              <h1 style="letter-spacing:5px;">${otp}</h1>
            </div>

            <p>This OTP will expire in <b>5 minutes</b>.</p>

            <hr>

            <p style="font-size:12px; text-align:center;">
              © 2025 AcadMate. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error("❌ Email Error:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = {
  sendOTPEmail,
};