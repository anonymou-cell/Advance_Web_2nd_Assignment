const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Checkin = require('../models/Checkin');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const templates = require('../services/emailTemplates');

// GET /checkins
router.get('/', requireAuth, async (req, res) => {
  try {
    const { activityId, username } = req.query;
    const filter = {};
    if (activityId) {
      try { filter.activityId = new mongoose.Types.ObjectId(activityId); }
      catch { filter.activityId = activityId; }
    }
    if (username) filter.username = username.toLowerCase();
    const checkins = await Checkin.find(filter).sort({ checkedInAt: -1 });
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load check-ins' });
  }
});

// POST /checkins
router.post('/', requireAuth, async (req, res) => {
  try {
    const { code, activityId, username, employeeName } = req.body;
    if (!username || (!code && !activityId)) {
      return res.status(400).json({ message: 'A check-in code (or activityId) and username are required' });
    }
    let activity;
    if (code) {
      activity = await Activity.findOne({ checkInCode: code.trim().toUpperCase() });
    } else {
      activity = await Activity.findById(activityId);
    }
    if (!activity) return res.status(404).json({ message: 'Invalid or unrecognized check-in code' });

    const registration = await Registration.findOne({
      activityId: activity._id, username: username.toLowerCase(), status: { $ne: 'cancelled' }
    });
    if (!registration) {
      return res.status(400).json({ message: `You are not registered for "${activity.title}"` });
    }
    const existingCheckin = await Checkin.findOne({
      activityId: activity._id, username: username.toLowerCase()
    });
    if (existingCheckin) {
      return res.status(409).json({ message: `You are already checked in to "${activity.title}"`, checkin: existingCheckin });
    }
    const checkin = new Checkin({
      activityId: activity._id, activityTitle: activity.title,
      username: username.toLowerCase(), employeeName: employeeName || registration.employeeName || username
    });
    await checkin.save();

    // Send check-in confirmation email
    const t = templates.checkinConfirmation(
      { fullName: employeeName || registration.employeeName || username },
      activity
    );
    sendEmail(username.toLowerCase(), t.subject, t.text, t.html);

    res.status(201).json(checkin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check in' });
  }
});

// DELETE /checkins/:id (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const checkin = await Checkin.findByIdAndDelete(req.params.id);
    if (!checkin) return res.status(404).json({ message: 'Check-in not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove check-in' });
  }
});

module.exports = router;
