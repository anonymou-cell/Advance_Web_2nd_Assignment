const mongoose = require('mongoose');
const crypto = require('crypto');

function generateCheckInCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  serviceType: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: ''
  },
  maxSeats: {
    type: Number,
    required: true,
    min: 1
  },
  seatsTaken: {
    type: Number,
    default: 0
  },
  cutOffDateTime: {
    type: String,
    required: true
  },
  checkInCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate check-in code if not set
activitySchema.pre('save', async function () {
  if (!this.checkInCode) {
    this.checkInCode = generateCheckInCode();
  }
});

activitySchema.statics.generateCode = generateCheckInCode;

module.exports = mongoose.model('Activity', activitySchema);
