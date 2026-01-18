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
    const { email, name, password, sport, city, area, latitude, longitude } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

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

    // If user doesn't exist, create unverified user with password
    if (!existingUser) {
      await User.create({
        email,
        name,
        password,
        sport,
        city,
        area,
        latitude: latitude || null,
        longitude: longitude || null,
        isVerified: false
      });
    } else {
      // Update existing unverified user (including password)
      existingUser.name = name;
      existingUser.password = password;
      existingUser.sport = sport;
      existingUser.city = city;
      existingUser.area = area;
      existingUser.latitude = latitude || null;
      existingUser.longitude = longitude || null;
      await existingUser.save(); // This will hash the password via pre-save hook
    }

    // Send OTP via email (non-blocking - don't fail signup if email fails)
    try {
      await sendOTPEmail(email, otp, 'signup');
    } catch (emailError) {
      console.error('Email send failed, but OTP was generated:', emailError.message);
      // OTP is logged to console in sendOTPEmail, so signup can still proceed
    }

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

// @desc    Login with email and password
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update user activity
    user.isActive = true;
    user.lastActive = new Date();
    await user.save({ validateModifiedOnly: true });

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
    console.error('Login Error:', error);
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
  login,
  getMe,
  updateProfile,
  logout
};
