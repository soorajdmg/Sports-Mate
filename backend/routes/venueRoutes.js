const express = require('express');
const router = express.Router();
const {
  searchNearbyVenues,
  getVenueDetails,
  getVenuePlayers
} = require('../controllers/venueController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Search nearby venues
router.get('/nearby', searchNearbyVenues);

// Get venue details
router.get('/:placeId', getVenueDetails);

// Get players checked in at venue
router.get('/:placeId/players', getVenuePlayers);

module.exports = router;
