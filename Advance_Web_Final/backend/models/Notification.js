const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    default: null
  },
  activityTitle: {
    type: String,
    default: null
  },
  targetUsername: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['broadcast', 'reminder'],
    default: 'broadcast'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
