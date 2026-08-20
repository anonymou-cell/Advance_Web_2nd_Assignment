const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
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
  status: {
    type: String,
    enum: ['registered', 'cancelled'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  }
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ activityId: 1, username: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
