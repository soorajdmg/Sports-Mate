const express = require('express');
const router = express.Router();
const {
  checkin,
  getActiveCheckin,
  checkout,
  getNearbyCheckins
} = require('../controllers/checkinController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get user's active check-in
router.get('/active', getActiveCheckin);

// Get nearby active check-ins
router.get('/nearby', getNearbyCheckins);

// Create a new check-in
router.post('/', checkin);

// Check out (end check-in early)
router.delete('/:checkinId', checkout);

module.exports = router;
