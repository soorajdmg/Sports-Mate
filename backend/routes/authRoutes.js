const express = require('express');
const router = express.Router();
const {
  sendSignupOTP,
  verifySignupOTP,
  sendLoginOTP,
  verifyLoginOTP,
  getMe,
  updateProfile,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Signup routes
router.post('/signup/send-otp', sendSignupOTP);
router.post('/signup/verify-otp', verifySignupOTP);

// Login routes
router.post('/login/send-otp', sendLoginOTP);
router.post('/login/verify-otp', verifyLoginOTP);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;
