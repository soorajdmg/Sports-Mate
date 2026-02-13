const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placeId: {
    type: String,
    required: true,
    index: true
  },
  venueName: {
    type: String,
    required: true
  },
  venueAddress: {
    type: String,
    required: true
  },
  venueLocation: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  sport: {
    type: String,
    enum: ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'volleyball', 'hockey', 'swimming', 'general'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for finding user's active check-in
checkinSchema.index({ user: 1, status: 1 });

// Compound index for finding check-ins at a venue
checkinSchema.index({ placeId: 1, status: 1 });

// TTL index to automatically delete expired check-ins after 24 hours
checkinSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

// Pre-save hook to set expiry time (2 hours from creation)
checkinSchema.pre('save', function() {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }
});

// Static method to get active check-in for a user
checkinSchema.statics.getActiveCheckin = async function(userId) {
  // First, mark expired check-ins
  await this.updateMany(
    { user: userId, status: 'active', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );

  return await this.findOne({
    user: userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('user', 'name sport');
};

// Static method to get all active check-ins at a venue
checkinSchema.statics.getVenueCheckins = async function(placeId) {
  // Mark expired check-ins first
  await this.updateMany(
    { placeId, status: 'active', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );

  return await this.find({
    placeId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('user', 'name sport city area lastActive');
};

// Static method to get nearby active check-ins
checkinSchema.statics.getNearbyCheckins = async function(lat, lng, radiusKm = 10) {
  // Mark expired check-ins first
  await this.updateMany(
    { status: 'active', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );

  const checkins = await this.find({
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('user', 'name sport city area lastActive');

  // Filter by distance (using Haversine formula)
  const R = 6371; // Earth's radius in km

  return checkins.filter(checkin => {
    const dLat = ((checkin.venueLocation.lat - lat) * Math.PI) / 180;
    const dLon = ((checkin.venueLocation.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((checkin.venueLocation.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    checkin._doc.distance = Math.round(distance * 10) / 10;
    return distance <= radiusKm;
  });
};

module.exports = mongoose.model('Checkin', checkinSchema);
