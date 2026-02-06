const Checkin = require('../models/Checkin');
const User = require('../models/User');

// @desc    Check in to a venue
// @route   POST /api/checkins
// @access  Private
const checkin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { placeId, venueName, venueAddress, venueLocation, sport } = req.body;

    // Validate required fields
    if (!placeId || !venueName || !venueAddress || !venueLocation) {
      return res.status(400).json({
        success: false,
        message: 'Place ID, venue name, address, and location are required'
      });
    }

    if (!venueLocation.lat || !venueLocation.lng) {
      return res.status(400).json({
        success: false,
        message: 'Venue location must include lat and lng'
      });
    }

    // Check if user already has an active check-in
    const existingCheckin = await Checkin.getActiveCheckin(userId);
    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active check-in. Please check out first.',
        activeCheckin: {
          id: existingCheckin._id,
          venueName: existingCheckin.venueName,
          expiresAt: existingCheckin.expiresAt
        }
      });
    }

    // Create new check-in
    const checkinData = {
      user: userId,
      placeId,
      venueName,
      venueAddress,
      venueLocation: {
        lat: venueLocation.lat,
        lng: venueLocation.lng
      },
      sport: sport || req.user.sport || 'general',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    };

    const newCheckin = await Checkin.create(checkinData);

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      checkin: {
        id: newCheckin._id,
        placeId: newCheckin.placeId,
        venueName: newCheckin.venueName,
        venueAddress: newCheckin.venueAddress,
        venueLocation: newCheckin.venueLocation,
        sport: newCheckin.sport,
        expiresAt: newCheckin.expiresAt,
        createdAt: newCheckin.createdAt
      }
    });
  } catch (error) {
    console.error('Check-in Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in'
    });
  }
};

// @desc    Get user's active check-in
// @route   GET /api/checkins/active
// @access  Private
const getActiveCheckin = async (req, res) => {
  try {
    const userId = req.user._id;
    const checkin = await Checkin.getActiveCheckin(userId);

    if (!checkin) {
      return res.status(200).json({
        success: true,
        hasActiveCheckin: false,
        checkin: null
      });
    }

    // Calculate time remaining
    const timeRemaining = Math.max(0, checkin.expiresAt - new Date());
    const minutesRemaining = Math.floor(timeRemaining / 60000);

    res.status(200).json({
      success: true,
      hasActiveCheckin: true,
      checkin: {
        id: checkin._id,
        placeId: checkin.placeId,
        venueName: checkin.venueName,
        venueAddress: checkin.venueAddress,
        venueLocation: checkin.venueLocation,
        sport: checkin.sport,
        expiresAt: checkin.expiresAt,
        createdAt: checkin.createdAt,
        minutesRemaining
      }
    });
  } catch (error) {
    console.error('Get Active Check-in Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active check-in'
    });
  }
};

// @desc    Check out (end check-in early)
// @route   DELETE /api/checkins/:checkinId
// @access  Private
const checkout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { checkinId } = req.params;

    const checkin = await Checkin.findById(checkinId);

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Check-in not found'
      });
    }

    // Verify ownership
    if (checkin.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check out of this venue'
      });
    }

    // Update status to expired
    checkin.status = 'expired';
    await checkin.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully'
    });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out'
    });
  }
};

// @desc    Get nearby active check-ins
// @route   GET /api/checkins/nearby
// @access  Private
const getNearbyCheckins = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const currentUserId = req.user._id;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const checkins = await Checkin.getNearbyCheckins(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );

    // Format response and exclude current user
    const formattedCheckins = checkins
      .filter(c => c.user._id.toString() !== currentUserId.toString())
      .map(checkin => ({
        id: checkin._id,
        placeId: checkin.placeId,
        venueName: checkin.venueName,
        venueAddress: checkin.venueAddress,
        venueLocation: checkin.venueLocation,
        distance: checkin._doc.distance,
        user: {
          id: checkin.user._id,
          name: checkin.user.name,
          sport: checkin.user.sport,
          city: checkin.user.city,
          area: checkin.user.area,
          isOnline: User.isUserActive(checkin.user.lastActive)
        },
        expiresAt: checkin.expiresAt
      }));

    res.status(200).json({
      success: true,
      count: formattedCheckins.length,
      checkins: formattedCheckins
    });
  } catch (error) {
    console.error('Get Nearby Check-ins Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby check-ins'
    });
  }
};

module.exports = {
  checkin,
  getActiveCheckin,
  checkout,
  getNearbyCheckins
};
