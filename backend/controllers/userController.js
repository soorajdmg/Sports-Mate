const User = require('../models/User');

// @desc    Discover nearby teammates
// @route   GET /api/users/discover
// @access  Private
const discoverTeammates = async (req, res) => {
  try {
    const { sport, city, area, activeOnly } = req.query;
    const currentUserId = req.user._id;

    // Build query
    const query = {
      _id: { $ne: currentUserId }, // Exclude current user
      isVerified: true
    };

    // Filter by sport
    if (sport) {
      query.sport = sport;
    }

    // Filter by city
    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    // Filter by area
    if (area) {
      query.area = { $regex: new RegExp(area, 'i') };
    }

    // Filter by active status (within last 15 minutes)
    if (activeOnly === 'true') {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      query.lastActive = { $gte: fifteenMinutesAgo };
    }

    const teammates = await User.find(query)
      .select('name sport city area isActive lastActive')
      .sort({ lastActive: -1 })
      .limit(50);

    // Add computed active status
    const teammatesWithStatus = teammates.map(user => ({
      id: user._id,
      name: user.name,
      sport: user.sport,
      city: user.city,
      area: user.area,
      isOnline: User.isUserActive(user.lastActive),
      lastActive: user.lastActive
    }));

    res.status(200).json({
      success: true,
      count: teammatesWithStatus.length,
      teammates: teammatesWithStatus
    });
  } catch (error) {
    console.error('Discover Teammates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teammates'
    });
  }
};

// @desc    Get nearby teammates (same city/area)
// @route   GET /api/users/nearby
// @access  Private
const getNearbyTeammates = async (req, res) => {
  try {
    const currentUser = req.user;
    const { sport } = req.query;

    // Find users in the same city
    const query = {
      _id: { $ne: currentUser._id },
      isVerified: true,
      city: { $regex: new RegExp(currentUser.city, 'i') }
    };

    // Optional sport filter
    if (sport) {
      query.sport = sport;
    }

    const teammates = await User.find(query)
      .select('name sport city area isActive lastActive')
      .sort({ lastActive: -1 })
      .limit(20);

    // Separate by area (same area first)
    const sameArea = [];
    const otherAreas = [];

    teammates.forEach(user => {
      const teammate = {
        id: user._id,
        name: user.name,
        sport: user.sport,
        city: user.city,
        area: user.area,
        isOnline: User.isUserActive(user.lastActive),
        lastActive: user.lastActive
      };

      if (user.area.toLowerCase() === currentUser.area.toLowerCase()) {
        sameArea.push(teammate);
      } else {
        otherAreas.push(teammate);
      }
    });

    res.status(200).json({
      success: true,
      sameArea: {
        count: sameArea.length,
        teammates: sameArea
      },
      nearbyAreas: {
        count: otherAreas.length,
        teammates: otherAreas
      }
    });
  } catch (error) {
    console.error('Get Nearby Teammates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby teammates'
    });
  }
};

// @desc    Get active teammates
// @route   GET /api/users/active
// @access  Private
const getActiveTeammates = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const activeTeammates = await User.find({
      _id: { $ne: currentUserId },
      isVerified: true,
      lastActive: { $gte: fifteenMinutesAgo }
    })
      .select('name sport city area lastActive')
      .sort({ lastActive: -1 })
      .limit(30);

    const teammates = activeTeammates.map(user => ({
      id: user._id,
      name: user.name,
      sport: user.sport,
      city: user.city,
      area: user.area,
      isOnline: true,
      lastActive: user.lastActive
    }));

    res.status(200).json({
      success: true,
      count: teammates.length,
      teammates
    });
  } catch (error) {
    console.error('Get Active Teammates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active teammates'
    });
  }
};

// @desc    Get available sports
// @route   GET /api/users/sports
// @access  Public
const getSports = async (req, res) => {
  const sports = [
    { value: 'football', label: 'Football' },
    { value: 'cricket', label: 'Cricket' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'hockey', label: 'Hockey' },
    { value: 'swimming', label: 'Swimming' }
  ];

  res.status(200).json({
    success: true,
    sports
  });
};

module.exports = {
  discoverTeammates,
  getNearbyTeammates,
  getActiveTeammates,
  getSports
};
