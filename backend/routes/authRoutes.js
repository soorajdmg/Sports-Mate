const express = require('express');
const router = express.Router();
const {
  sendSignupOTP,
  verifySignupOTP,
  login,
  getMe,
  updateProfile,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Signup routes (with OTP verification)
router.post('/signup/send-otp', sendSignupOTP);
router.post('/signup/verify-otp', verifySignupOTP);

// Login route (password-based)
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;
