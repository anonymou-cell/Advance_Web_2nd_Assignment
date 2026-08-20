const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  activityTitle: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    required: true,
    lowercase: true
  },
  employeeName: {
    type: String,
    default: ''
  },
  checkedInAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate check-ins
checkinSchema.index({ activityId: 1, username: 1 }, { unique: true });

module.exports = mongoose.model('Checkin', checkinSchema);
