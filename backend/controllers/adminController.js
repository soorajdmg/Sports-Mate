const Admin = require('../models/Admin');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin with password
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ isVerified: true });

    // Active users (within last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      isVerified: true,
      lastActive: { $gte: fifteenMinutesAgo }
    });

    // Users by sport
    const usersBySport = await User.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: '$sport', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Users by city
    const usersByCity = await User.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      isVerified: true,
      createdAt: { $gte: today }
    });

    // New users this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({
      isVerified: true,
      createdAt: { $gte: weekAgo }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        usersBySport: usersBySport.map(item => ({
          sport: item._id,
          count: item.count
        })),
        usersByCity: usersByCity.map(item => ({
          city: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { sport, city, area, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { isVerified: true };

    if (sport) {
      query.sport = sport;
    }

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (area) {
      query.area = { $regex: new RegExp(area, 'i') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('name email sport city area isActive lastActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const usersWithStatus = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      sport: user.sport,
      city: user.city,
      area: user.area,
      isOnline: new Date(user.lastActive) > fifteenMinutesAgo,
      lastActive: user.lastActive,
      joinedAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      users: usersWithStatus
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// @desc    Get unique cities
// @route   GET /api/admin/cities
// @access  Admin
const getCities = async (req, res) => {
  try {
    const cities = await User.distinct('city', { isVerified: true });
    res.status(200).json({
      success: true,
      cities: cities.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities'
    });
  }
};

// @desc    Get unique areas by city
// @route   GET /api/admin/areas
// @access  Admin
const getAreas = async (req, res) => {
  try {
    const { city } = req.query;
    const query = { isVerified: true };

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    const areas = await User.distinct('area', query);
    res.status(200).json({
      success: true,
      areas: areas.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getCities,
  getAreas,
  deleteUser
};
