const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'login'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - auto-delete when expired
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash OTP before saving
otpSchema.pre('save', async function() {
  if (!this.isModified('otp')) return;
  this.otp = await bcrypt.hash(this.otp, 10);
});

// Verify OTP
otpSchema.methods.verifyOTP = async function(candidateOTP) {
  return await bcrypt.compare(candidateOTP, this.otp);
};

// Check if OTP is expired
otpSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('OTP', otpSchema);
