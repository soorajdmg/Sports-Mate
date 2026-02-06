const Message = require('../models/Message');
const Connection = require('../models/Connection');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get messages with a specific user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify connection exists
    const isConnected = await Connection.areConnected(currentUserId, otherUserId);
    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: 'You must be connected to view messages'
      });
    }

    // Get messages
    const messages = await Message.getConversation(currentUserId, otherUserId, page, limit);

    // Mark messages from the other user as read
    await Message.markAsRead(otherUserId, currentUserId);

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      content: msg.content,
      senderId: msg.sender._id,
      senderName: msg.sender.name,
      isOwn: msg.sender._id.toString() === currentUserId.toString(),
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedMessages.length,
      page,
      messages: formattedMessages,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        sport: otherUser.sport,
        isOnline: User.isUserActive(otherUser.lastActive),
        lastActive: otherUser.lastActive
      }
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.getConversations(new mongoose.Types.ObjectId(userId));

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// @desc    Send a message (REST fallback - WebSocket is primary)
// @route   POST /api/messages/:userId
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify connection exists
    const isConnected = await Connection.areConnected(senderId, receiverId);
    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: 'You must be connected to send messages'
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    await message.populate('sender', 'name');

    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        senderId: message.sender._id,
        senderName: message.sender.name,
        isOwn: true,
        isRead: false,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// @desc    Mark messages as read
// @route   POST /api/messages/:userId/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const senderId = req.params.userId;

    const result = await Message.markAsRead(senderId, currentUserId);

    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark Messages Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

module.exports = {
  getMessages,
  getConversations,
  getUnreadCount,
  sendMessage,
  markMessagesAsRead
};
