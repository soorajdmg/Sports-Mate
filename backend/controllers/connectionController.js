const Connection = require('../models/Connection');
const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
// @access  Private
const sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const recipientId = req.params.userId;

    // Check if trying to connect with self
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send connection request to yourself'
      });
    }

    // Check if recipient exists and is verified
    const recipient = await User.findOne({ _id: recipientId, isVerified: true });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Already connected with this user'
        });
      }
      if (existingConnection.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Connection request already pending'
        });
      }
      if (existingConnection.status === 'blocked') {
        return res.status(400).json({
          success: false,
          message: 'Cannot connect with this user'
        });
      }
      // If rejected, allow re-sending request by updating it
      if (existingConnection.status === 'rejected') {
        existingConnection.status = 'pending';
        existingConnection.requester = requesterId;
        existingConnection.recipient = recipientId;
        await existingConnection.save();

        return res.status(200).json({
          success: true,
          message: 'Connection request sent',
          connection: existingConnection
        });
      }
    }

    // Create new connection request
    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent',
      connection
    });
  } catch (error) {
    console.error('Send Connection Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send connection request'
    });
  }
};

// @desc    Get pending connection requests (received)
// @route   GET /api/connections/pending
// @access  Private
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const pendingRequests = await Connection.find({
      recipient: userId,
      status: 'pending'
    })
      .populate('requester', 'name sport city area lastActive')
      .sort({ createdAt: -1 });

    const requests = pendingRequests.map(conn => ({
      connectionId: conn._id,
      user: {
        id: conn.requester._id,
        name: conn.requester.name,
        sport: conn.requester.sport,
        city: conn.requester.city,
        area: conn.requester.area,
        isOnline: User.isUserActive(conn.requester.lastActive),
        lastActive: conn.requester.lastActive
      },
      createdAt: conn.createdAt
    }));

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get Pending Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
};

// @desc    Get sent connection requests
// @route   GET /api/connections/sent
// @access  Private
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const sentRequests = await Connection.find({
      requester: userId,
      status: 'pending'
    })
      .populate('recipient', 'name sport city area lastActive')
      .sort({ createdAt: -1 });

    const requests = sentRequests.map(conn => ({
      connectionId: conn._id,
      user: {
        id: conn.recipient._id,
        name: conn.recipient.name,
        sport: conn.recipient.sport,
        city: conn.recipient.city,
        area: conn.recipient.area,
        isOnline: User.isUserActive(conn.recipient.lastActive),
        lastActive: conn.recipient.lastActive
      },
      createdAt: conn.createdAt
    }));

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get Sent Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent requests'
    });
  }
};

// @desc    Accept connection request
// @route   POST /api/connections/:connectionId/accept
// @access  Private
const acceptConnection = async (req, res) => {
  try {
    const userId = req.user._id;
    const connectionId = req.params.connectionId;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Only the recipient can accept
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Connection request is no longer pending'
      });
    }

    connection.status = 'accepted';
    await connection.save();

    res.status(200).json({
      success: true,
      message: 'Connection request accepted',
      connection
    });
  } catch (error) {
    console.error('Accept Connection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept connection request'
    });
  }
};

// @desc    Reject connection request
// @route   POST /api/connections/:connectionId/reject
// @access  Private
const rejectConnection = async (req, res) => {
  try {
    const userId = req.user._id;
    const connectionId = req.params.connectionId;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Only the recipient can reject
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Connection request is no longer pending'
      });
    }

    connection.status = 'rejected';
    await connection.save();

    res.status(200).json({
      success: true,
      message: 'Connection request rejected'
    });
  } catch (error) {
    console.error('Reject Connection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject connection request'
    });
  }
};

// @desc    Remove connection
// @route   DELETE /api/connections/:connectionId
// @access  Private
const removeConnection = async (req, res) => {
  try {
    const userId = req.user._id;
    const connectionId = req.params.connectionId;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Either user can remove the connection
    const isRequester = connection.requester.toString() === userId.toString();
    const isRecipient = connection.recipient.toString() === userId.toString();

    if (!isRequester && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this connection'
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.status(200).json({
      success: true,
      message: 'Connection removed'
    });
  } catch (error) {
    console.error('Remove Connection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove connection'
    });
  }
};

// @desc    Get all accepted connections
// @route   GET /api/connections
// @access  Private
const getConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    })
      .populate('requester', 'name sport city area lastActive')
      .populate('recipient', 'name sport city area lastActive')
      .sort({ updatedAt: -1 });

    const formattedConnections = connections.map(conn => {
      // Get the other user (not the current user)
      const otherUser = conn.requester._id.toString() === userId.toString()
        ? conn.recipient
        : conn.requester;

      return {
        connectionId: conn._id,
        user: {
          id: otherUser._id,
          name: otherUser.name,
          sport: otherUser.sport,
          city: otherUser.city,
          area: otherUser.area,
          isOnline: User.isUserActive(otherUser.lastActive),
          lastActive: otherUser.lastActive
        },
        connectedAt: conn.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedConnections.length,
      connections: formattedConnections
    });
  } catch (error) {
    console.error('Get Connections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections'
    });
  }
};

// @desc    Get connection status with a specific user
// @route   GET /api/connections/status/:userId
// @access  Private
const getConnectionStatus = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const result = await Connection.getConnectionStatus(currentUserId, otherUserId);

    res.status(200).json({
      success: true,
      status: result.status,
      connectionId: result.connection?._id || null,
      isRequester: result.isRequester || false
    });
  } catch (error) {
    console.error('Get Connection Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status'
    });
  }
};

// @desc    Cancel sent connection request
// @route   DELETE /api/connections/cancel/:connectionId
// @access  Private
const cancelRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const connectionId = req.params.connectionId;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Only the requester can cancel
    if (connection.requester.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.status(200).json({
      success: true,
      message: 'Connection request cancelled'
    });
  } catch (error) {
    console.error('Cancel Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel connection request'
    });
  }
};

module.exports = {
  sendConnectionRequest,
  getPendingRequests,
  getSentRequests,
  acceptConnection,
  rejectConnection,
  removeConnection,
  getConnections,
  getConnectionStatus,
  cancelRequest
};
