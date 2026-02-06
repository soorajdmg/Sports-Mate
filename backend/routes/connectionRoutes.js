const express = require('express');
const router = express.Router();
const {
  sendConnectionRequest,
  getPendingRequests,
  getSentRequests,
  acceptConnection,
  rejectConnection,
  removeConnection,
  getConnections,
  getConnectionStatus,
  cancelRequest
} = require('../controllers/connectionController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get all accepted connections
router.get('/', getConnections);

// Get pending requests (received)
router.get('/pending', getPendingRequests);

// Get sent requests
router.get('/sent', getSentRequests);

// Get connection status with a specific user
router.get('/status/:userId', getConnectionStatus);

// Send connection request
router.post('/request/:userId', sendConnectionRequest);

// Accept connection request
router.post('/:connectionId/accept', acceptConnection);

// Reject connection request
router.post('/:connectionId/reject', rejectConnection);

// Cancel sent request
router.delete('/cancel/:connectionId', cancelRequest);

// Remove connection
router.delete('/:connectionId', removeConnection);

module.exports = router;
