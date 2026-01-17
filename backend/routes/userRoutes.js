const express = require('express');
const router = express.Router();
const {
  discoverTeammates,
  getNearbyTeammates,
  getActiveTeammates,
  getSports
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/sports', getSports);

// Protected routes
router.get('/discover', protect, discoverTeammates);
router.get('/nearby', protect, getNearbyTeammates);
router.get('/active', protect, getActiveTeammates);

module.exports = router;
