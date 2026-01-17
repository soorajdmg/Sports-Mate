const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  sport: {
    type: String,
    required: [true, 'Sport preference is required'],
    enum: ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'volleyball', 'hockey', 'swimming']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    index: true
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true,
    index: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient filtering
userSchema.index({ sport: 1, city: 1, isActive: 1 });
userSchema.index({ city: 1, area: 1 });

// Update lastActive on every query (called from middleware)
userSchema.methods.updateActivity = async function() {
  this.lastActive = new Date();
  this.isActive = true;
  await this.save();
};

// Static method to check if user is active (within last 15 minutes)
userSchema.statics.isUserActive = function(lastActive) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return new Date(lastActive) > fifteenMinutesAgo;
};

module.exports = mongoose.model('User', userSchema);
