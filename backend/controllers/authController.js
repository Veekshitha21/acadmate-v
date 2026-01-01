const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const { generateOTP, storeOTP, verifyOTP, isOTPVerified, deleteOTP } = require('../utils/otpService');
const { sendOTPEmail } = require('../utils/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// SEND OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).get();
    if (!snapshot.empty) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(normalizedEmail, otp);

    // Send OTP email
    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails - log it for debugging
      // In production, you might want to handle this differently
      // For now, return success but note the email issue
      return res.json({ 
        message: 'OTP generated. Please check your email (note: email sending may have failed).',
        email: normalizedEmail 
      });
    }

    res.json({ 
      message: 'OTP sent successfully to your email',
      email: normalizedEmail 
    });
  } catch (err) {
    console.error('Send OTP failed:', err);
    const errorMessage = err.message || 'Failed to send OTP. Please try again.';
    res.status(500).json({ message: errorMessage });
  }
};

// VERIFY OTP
const verifyOTPCode = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
   const result = verifyOTP(normalizedEmail, otp);

if (!result.valid) {
  return res.status(400).json({ message: result.message });
}

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP failed:', err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// REGISTER
const register = async (req, res) => {
  try {
    const { username, usn, password, branch, section, email, phone, otp } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if OTP was verified
    const alreadyVerified = isOTPVerified(normalizedEmail);
    console.log('Registration check:', { 
      normalizedEmail, 
      alreadyVerified, 
      hasOTP: !!otp,
      otpLength: otp?.length 
    });
    
    if (!alreadyVerified) {
      // If not verified, try to verify now with provided OTP
      if (!otp || !otp.trim()) {
        console.log('OTP missing in registration request');
        return res.status(400).json({ 
          message: 'OTP verification is required. Please verify your email first or provide OTP.' 
        });
      }
      
      // Try to verify the OTP
      const otpResult = verifyOTP(normalizedEmail, otp.trim());
      console.log('OTP verification result:', otpResult);
      
      if (!otpResult.valid) {
        console.log('OTP verification failed:', otpResult.message);
        return res.status(400).json({ 
          message: otpResult.message || 'OTP not found or expired. Please verify your email again.' 
        });
      }
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).get();

    if (!snapshot.empty) return res.status(400).json({ message: 'User already exists' });

    // Normalize phone number (remove non-digits, take last 10 digits)
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserRef = usersRef.doc(); // Generate new document
    await newUserRef.set({
      username,
      usn,
      branch,
      section,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      emailVerified: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    // Delete OTP after successful registration
    deleteOTP(normalizedEmail);

    res.status(201).json({
      user: { id: newUserRef.id, username, usn, branch, section, email: normalizedEmail, phone },
      token: generateToken(newUserRef.id),
    });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// LOGIN
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const normalizedEmail = email.trim().toLowerCase();
//     const usersRef = db.collection('users');
//     const snapshot = await usersRef.where('email', '==', normalizedEmail).get();

//     if (snapshot.empty) return res.status(400).json({ message: 'Invalid credentials' });

//     const userDoc = snapshot.docs[0];
//     const userData = userDoc.data();

//     const valid = await bcrypt.compare(password, userData.password);
//     if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

//     res.json({
//       user: {
//         id: userDoc.id,
//         username: userData.username,
//         usn: userData.usn,
//         branch: userData.branch,
//         section: userData.section,
//         email: userData.email,
//         phone: userData.phone,
//       },
//       token: generateToken(userDoc.id),
//     });
//   } catch (err) {
//     console.error('Login failed:', err);
//     res.status(500).json({ message: 'Login failed' });
//   }
// };
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const normalizedEmail = email.trim().toLowerCase();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).get();

    if (snapshot.empty) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const valid = await bcrypt.compare(password, userData.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    res.json({
      success: true,
      token: generateToken(userDoc.id),
      user: {
        id: userDoc.id,
        username: userData.username,
        usn: userData.usn,
        branch: userData.branch,
        section: userData.section,
        email: userData.email,
        phone: userData.phone,
      },
    });
  } catch (err) {
    console.error("🔥 Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// FORGOT PASSWORD - SEND OTP
const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email exists in the database
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).get();
    
    if (snapshot.empty) {
      // Don't reveal if email exists for security, just send success message
      return res.json({ 
        message: 'If the email exists, OTP will be sent to your email' 
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(normalizedEmail, otp);

    // Send OTP email
    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails - log it for debugging
      // For security, still return success message
      return res.json({ 
        message: 'If the email exists, OTP has been sent to your email (note: email sending may have failed)',
        email: normalizedEmail 
      });
    }

    res.json({ 
      message: 'If the email exists, OTP has been sent to your email',
      email: normalizedEmail 
    });
  } catch (err) {
    console.error('Send forgot password OTP failed:', err);
    const errorMessage = err.message || 'Failed to send OTP. Please try again.';
    res.status(500).json({ message: errorMessage });
  }
};

// FORGOT PASSWORD - VERIFY OTP
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = verifyOTP(normalizedEmail, otp);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify forgot password OTP failed:', err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// FORGOT PASSWORD - RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if OTP was verified
    const alreadyVerified = isOTPVerified(normalizedEmail);
    
    if (!alreadyVerified) {
      // If not verified, try to verify now with provided OTP
      if (!otp || !otp.trim()) {
        return res.status(400).json({ 
          message: 'OTP verification is required. Please verify your email first or provide OTP.' 
        });
      }
      
      const otpResult = verifyOTP(normalizedEmail, otp.trim());
      if (!otpResult.valid) {
        return res.status(400).json({ 
          message: otpResult.message || 'OTP not found or expired. Please verify your email again.' 
        });
      }
    }

    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userDoc = snapshot.docs[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in Firestore
    await userDoc.ref.update({
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    });

    // Delete OTP after successful password reset
    deleteOTP(normalizedEmail);

    res.json({ 
      message: 'Password reset successfully. Please login with your new password.' 
    });
  } catch (err) {
    console.error('Reset password failed:', err);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

module.exports = { 
  register, 
  login, 
  sendOTP, 
  verifyOTPCode,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
};
