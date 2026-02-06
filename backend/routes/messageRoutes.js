const express = require('express');
const router = express.Router();
const {
  getMessages,
  getConversations,
  getUnreadCount,
  sendMessage,
  markMessagesAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get all conversations
router.get('/conversations', getConversations);

// Get unread message count
router.get('/unread/count', getUnreadCount);

// Get messages with a specific user
router.get('/:userId', getMessages);

// Send message to a user (REST fallback)
router.post('/:userId', sendMessage);

// Mark messages from a user as read
router.post('/:userId/read', markMessagesAsRead);

module.exports = router;
