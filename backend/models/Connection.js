const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for efficient queries on recipient's pending requests
connectionSchema.index({ recipient: 1, status: 1 });

// Index for efficient queries on requester's sent requests
connectionSchema.index({ requester: 1, status: 1 });

// Static method to check if two users are connected
connectionSchema.statics.areConnected = async function(userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
  return !!connection;
};

// Static method to get connection status between two users
connectionSchema.statics.getConnectionStatus = async function(userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ]
  });

  if (!connection) {
    return { status: 'none', connection: null };
  }

  return {
    status: connection.status,
    connection,
    isRequester: connection.requester.toString() === userId1.toString()
  };
};

module.exports = mongoose.model('Connection', connectionSchema);
