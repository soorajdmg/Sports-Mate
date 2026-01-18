const User = require('../models/User');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Discover nearby teammates
// @route   GET /api/users/discover
// @access  Private
const discoverTeammates = async (req, res) => {
  try {
    const { sport, city, name, activeOnly, maxDistance } = req.query;
    const currentUser = req.user;
    const currentUserId = currentUser._id;

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

    // Filter by name
    if (name) {
      query.name = { $regex: new RegExp(name, 'i') };
    }

    // Filter by active status (within last 15 minutes)
    if (activeOnly === 'true') {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      query.lastActive = { $gte: fifteenMinutesAgo };
    }

    let teammates = await User.find(query)
      .select('name sport city area latitude longitude isActive lastActive')
      .sort({ lastActive: -1 })
      .limit(100);

    // Calculate distance and filter if maxDistance is provided
    const maxDistanceKm = maxDistance ? parseFloat(maxDistance) : null;
    const userHasLocation = currentUser.latitude && currentUser.longitude;

    let teammatesWithStatus = teammates.map(user => {
      let distance = null;

      if (userHasLocation && user.latitude && user.longitude) {
        distance = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          user.latitude,
          user.longitude
        );
      }

      return {
        id: user._id,
        name: user.name,
        sport: user.sport,
        city: user.city,
        area: user.area,
        isOnline: User.isUserActive(user.lastActive),
        lastActive: user.lastActive,
        distance: distance !== null ? Math.round(distance * 10) / 10 : null // Round to 1 decimal
      };
    });

    // Filter by distance if maxDistance is provided and user has location
    if (maxDistanceKm && userHasLocation) {
      teammatesWithStatus = teammatesWithStatus.filter(
        t => t.distance !== null && t.distance <= maxDistanceKm
      );
      // Sort by distance
      teammatesWithStatus.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Limit to 50 results
    teammatesWithStatus = teammatesWithStatus.slice(0, 50);

    res.status(200).json({
      success: true,
      count: teammatesWithStatus.length,
      teammates: teammatesWithStatus,
      userHasLocation
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
      .select('name sport city area latitude longitude isActive lastActive')
      .sort({ lastActive: -1 })
      .limit(20);

    const userHasLocation = currentUser.latitude && currentUser.longitude;

    // Separate by area (same area first)
    const sameArea = [];
    const otherAreas = [];

    teammates.forEach(user => {
      let distance = null;
      if (userHasLocation && user.latitude && user.longitude) {
        distance = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          user.latitude,
          user.longitude
        );
        distance = Math.round(distance * 10) / 10;
      }

      const teammate = {
        id: user._id,
        name: user.name,
        sport: user.sport,
        city: user.city,
        area: user.area,
        isOnline: User.isUserActive(user.lastActive),
        lastActive: user.lastActive,
        distance
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
    const currentUser = req.user;
    const currentUserId = currentUser._id;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const activeTeammates = await User.find({
      _id: { $ne: currentUserId },
      isVerified: true,
      lastActive: { $gte: fifteenMinutesAgo }
    })
      .select('name sport city area latitude longitude lastActive')
      .sort({ lastActive: -1 })
      .limit(30);

    const userHasLocation = currentUser.latitude && currentUser.longitude;

    const teammates = activeTeammates.map(user => {
      let distance = null;
      if (userHasLocation && user.latitude && user.longitude) {
        distance = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          user.latitude,
          user.longitude
        );
        distance = Math.round(distance * 10) / 10;
      }

      return {
        id: user._id,
        name: user.name,
        sport: user.sport,
        city: user.city,
        area: user.area,
        isOnline: true,
        lastActive: user.lastActive,
        distance
      };
    });

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
