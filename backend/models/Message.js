const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for fetching conversation between two users
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Index for fetching unread messages for a user
messageSchema.index({ receiver: 1, isRead: 1 });

// Index for getting latest message in conversations
messageSchema.index({ createdAt: -1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(userId1, userId2, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const messages = await this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name')
    .populate('receiver', 'name');

  return messages.reverse(); // Return in chronological order
};

// Static method to get all conversations for a user
messageSchema.statics.getConversations = async function(userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userId] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$content' },
        lastMessageTime: { $first: '$createdAt' },
        lastMessageSender: { $first: '$sender' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { lastMessageTime: -1 }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        oderId: '$_id',
        lastMessage: 1,
        lastMessageTime: 1,
        lastMessageSender: 1,
        unreadCount: 1,
        user: {
          _id: '$user._id',
          name: '$user.name',
          sport: '$user.sport',
          city: '$user.city',
          area: '$user.area',
          lastActive: '$user.lastActive'
        }
      }
    }
  ]);

  return conversations;
};

// Static method to get unread message count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    isRead: false
  });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(senderId, receiverId) {
  return await this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

module.exports = mongoose.model('Message', messageSchema);
