const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default in queries
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

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
