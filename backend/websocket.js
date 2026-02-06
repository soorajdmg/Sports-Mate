const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Connection = require('./models/Connection');
const User = require('./models/User');

// Store connected users: userId -> Set of WebSocket connections
const connectedUsers = new Map();

// Store user info: ws -> { userId, user }
const wsUserMap = new WeakMap();

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    // Extract token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        ws.close(4001, 'User not found');
        return;
      }

      const userId = user._id.toString();

      // Store user info in ws
      wsUserMap.set(ws, { userId, user });

      // Add to connected users
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(ws);

      // Update user's lastActive
      user.lastActive = new Date();
      user.isActive = true;
      await user.save();

      // Send connection success
      ws.send(JSON.stringify({
        type: 'connected',
        userId
      }));

      // Notify connections that this user is online
      broadcastPresence(userId, true);

      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await handleMessage(ws, message, userId);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle disconnect
      ws.on('close', async () => {
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            connectedUsers.delete(userId);
            // Notify connections that this user is offline
            broadcastPresence(userId, false);
          }
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

    } catch (error) {
      console.error('WebSocket auth error:', error);
      ws.close(4001, 'Authentication failed');
    }
  });

  return wss;
};

// Handle incoming WebSocket messages
const handleMessage = async (ws, message, senderId) => {
  const { type, payload } = message;

  switch (type) {
    case 'message:send':
      await handleSendMessage(ws, payload, senderId);
      break;

    case 'message:read':
      await handleMarkRead(ws, payload, senderId);
      break;

    case 'typing:start':
      handleTyping(payload, senderId, true);
      break;

    case 'typing:stop':
      handleTyping(payload, senderId, false);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
};

// Handle sending a new message
const handleSendMessage = async (ws, payload, senderId) => {
  const { receiverId, content } = payload;

  if (!receiverId || !content || !content.trim()) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid message payload'
    }));
    return;
  }

  try {
    // Verify connection exists
    const isConnected = await Connection.areConnected(senderId, receiverId);
    if (!isConnected) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'You must be connected to send messages'
      }));
      return;
    }

    // Create message in database
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    await newMessage.populate('sender', 'name');

    const messageData = {
      id: newMessage._id,
      content: newMessage.content,
      senderId: newMessage.sender._id,
      senderName: newMessage.sender.name,
      receiverId,
      isRead: false,
      createdAt: newMessage.createdAt
    };

    // Send confirmation to sender
    ws.send(JSON.stringify({
      type: 'message:sent',
      message: { ...messageData, isOwn: true }
    }));

    // Send message to receiver if online
    const receiverSockets = connectedUsers.get(receiverId);
    if (receiverSockets) {
      const receiverMessage = JSON.stringify({
        type: 'message:new',
        message: { ...messageData, isOwn: false }
      });
      receiverSockets.forEach(socket => {
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.send(receiverMessage);
        }
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }));
  }
};

// Handle marking messages as read
const handleMarkRead = async (ws, payload, readerId) => {
  const { senderId } = payload;

  if (!senderId) {
    return;
  }

  try {
    const result = await Message.markAsRead(senderId, readerId);

    // Notify the sender that their messages were read
    const senderSockets = connectedUsers.get(senderId);
    if (senderSockets && result.modifiedCount > 0) {
      const readNotification = JSON.stringify({
        type: 'message:read',
        readerId,
        readAt: new Date()
      });
      senderSockets.forEach(socket => {
        if (socket.readyState === 1) {
          socket.send(readNotification);
        }
      });
    }
  } catch (error) {
    console.error('Mark read error:', error);
  }
};

// Handle typing indicators
const handleTyping = (payload, senderId, isTyping) => {
  const { receiverId } = payload;

  if (!receiverId) {
    return;
  }

  const receiverSockets = connectedUsers.get(receiverId);
  if (receiverSockets) {
    const typingMessage = JSON.stringify({
      type: isTyping ? 'typing:start' : 'typing:stop',
      userId: senderId
    });
    receiverSockets.forEach(socket => {
      if (socket.readyState === 1) {
        socket.send(typingMessage);
      }
    });
  }
};

// Broadcast online/offline status to user's connections
const broadcastPresence = async (userId, isOnline) => {
  try {
    // Get all accepted connections for this user
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const presenceMessage = JSON.stringify({
      type: isOnline ? 'user:online' : 'user:offline',
      userId
    });

    connections.forEach(conn => {
      const otherUserId = conn.requester.toString() === userId
        ? conn.recipient.toString()
        : conn.requester.toString();

      const otherUserSockets = connectedUsers.get(otherUserId);
      if (otherUserSockets) {
        otherUserSockets.forEach(socket => {
          if (socket.readyState === 1) {
            socket.send(presenceMessage);
          }
        });
      }
    });
  } catch (error) {
    console.error('Broadcast presence error:', error);
  }
};

// Check if a user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

// Get list of online user IDs
const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

module.exports = {
  setupWebSocket,
  isUserOnline,
  getOnlineUsers
};
