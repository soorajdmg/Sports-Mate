const User = require('../models/User');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const generateToken = require('../utils/generateToken');
const { sendOTPEmail } = require('../utils/sendEmail');

// @desc    Send OTP for signup
// @route   POST /api/auth/signup/send-otp
// @access  Public
const sendSignupOTP = async (req, res) => {
  try {
    const { email, name, sport, city, area, latitude, longitude } = req.body;

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please login instead.'
      });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database (hashed)
    await OTP.create({
      email,
      otp,
      purpose: 'signup',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // If user doesn't exist, create unverified user
    if (!existingUser) {
      await User.create({
        email,
        name,
        sport,
        city,
        area,
        latitude: latitude || null,
        longitude: longitude || null,
        isVerified: false
      });
    } else {
      // Update existing unverified user
      await User.findByIdAndUpdate(existingUser._id, {
        name,
        sport,
        city,
        area,
        latitude: latitude || null,
        longitude: longitude || null
      });
    }

    // Send OTP via email
    await sendOTPEmail(email, otp, 'signup');

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send Signup OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

// @desc    Verify OTP and complete signup
// @route   POST /api/auth/signup/verify-otp
// @access  Public
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, purpose: 'signup' });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.'
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOTP(otp);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true, isActive: true, lastActive: new Date() },
      { new: true }
    );

    // Delete OTP record (single-use)
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        sport: user.sport,
        city: user.city,
        area: user.area
      }
    });
  } catch (error) {
    console.error('Verify Signup OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// @desc    Send OTP for login
// @route   POST /api/auth/login/send-otp
// @access  Public
const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Login attempt for email:', email);

    // Check if user exists and is verified
    const user = await User.findOne({ email: email.toLowerCase(), isVerified: true });
    if (!user) {
      console.log('User not found or not verified:', email);
      return res.status(400).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }
    console.log('User found:', user.name);

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database (hashed)
    await OTP.create({
      email,
      otp,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Send OTP via email
    await sendOTPEmail(email, otp, 'login');

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send Login OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/login/verify-otp
// @access  Public
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, purpose: 'login' });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.'
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOTP(otp);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Update user activity
    const user = await User.findOneAndUpdate(
      { email },
      { isActive: true, lastActive: new Date() },
      { new: true }
    );

    // Delete OTP record (single-use)
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        sport: user.sport,
        city: user.city,
        area: user.area
      }
    });
  } catch (error) {
    console.error('Verify Login OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        sport: user.sport,
        city: user.city,
        area: user.area,
        isActive: user.isActive,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, sport, city, area, latitude, longitude } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || req.user.name,
        sport: sport || req.user.sport,
        city: city || req.user.city,
        area: area || req.user.area,
        latitude: latitude !== undefined ? latitude : req.user.latitude,
        longitude: longitude !== undefined ? longitude : req.user.longitude,
        lastActive: new Date()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        sport: user.sport,
        city: user.city,
        area: user.area
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Logout user (mark as inactive)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  sendSignupOTP,
  verifySignupOTP,
  sendLoginOTP,
  verifyLoginOTP,
  getMe,
  updateProfile,
  logout
};
