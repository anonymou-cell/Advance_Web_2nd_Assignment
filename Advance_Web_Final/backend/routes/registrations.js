const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Activity = require('../models/Activity');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const templates = require('../services/emailTemplates');

// GET /registrations
router.get('/', requireAuth, async (req, res) => {
  try {
    const { activityId, username, status } = req.query;
    const filter = {};
    if (activityId) {
      try { filter.activityId = new mongoose.Types.ObjectId(activityId); }
      catch { filter.activityId = activityId; }
    }
    if (username) filter.username = username.toLowerCase();
    if (status) filter.status = status;
    const registrations = await Registration.find(filter).sort({ registeredAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations' });
  }
});

// GET /registrations/mine/:username
router.get('/mine/:username', requireAuth, async (req, res) => {
  try {
    const mine = await Registration.find({
      username: req.params.username.toLowerCase(),
      status: { $ne: 'cancelled' }
    });
    res.json(mine);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your registrations' });
  }
});

// POST /registrations
router.post('/', requireAuth, async (req, res) => {
  try {
    const { activityId, username, employeeName } = req.body;
    if (!activityId || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (new Date() > new Date(activity.cutOffDateTime)) {
      return res.status(400).json({ message: 'Registration cut-off has passed for this activity' });
    }
    if (activity.seatsTaken >= activity.maxSeats) {
      return res.status(400).json({ message: 'This activity is full' });
    }
    const alreadyRegistered = await Registration.findOne({
      activityId: activity._id, username: username.toLowerCase(), status: { $ne: 'cancelled' }
    });
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You are already registered for this activity' });
    }
    const registration = new Registration({
      activityId: activity._id, username: username.toLowerCase(), employeeName: employeeName || username
    });
    await registration.save();
    activity.seatsTaken += 1;
    await activity.save();

    // Send registration confirmation email
    const t = templates.registrationConfirmation({ fullName: employeeName || username }, activity);
    sendEmail(username.toLowerCase(), t.subject, t.text, t.html);

    res.status(201).json(registration);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register' });
  }
});

// PUT /registrations/:id/cancel
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.username.toLowerCase() !== req.user.email.toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot cancel another user\'s registration' });
    }
    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration already cancelled' });
    }
    const activity = await Activity.findById(registration.activityId);
    if (activity && new Date() > new Date(activity.cutOffDateTime)) {
      return res.status(400).json({ message: 'Cannot cancel after the cut-off time' });
    }
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();
    if (activity && activity.seatsTaken > 0) {
      activity.seatsTaken -= 1;
      await activity.save();
    }

    // Send cancellation email
    const t = templates.registrationCancelled(
      { fullName: registration.employeeName },
      activity ? activity.title : 'Activity'
    );
    sendEmail(registration.username, t.subject, t.text, t.html);

    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel registration' });
  }
});

// DELETE /registrations/:id (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.status !== 'cancelled') {
      const activity = await Activity.findById(registration.activityId);
      if (activity && activity.seatsTaken > 0) {
        activity.seatsTaken -= 1;
        await activity.save();
      }
      // Send removal email
      const t = templates.removedByAdmin(
        { fullName: registration.employeeName },
        activity ? activity.title : 'Activity'
      );
      sendEmail(registration.username, t.subject, t.text, t.html);
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove registration' });
  }
});

module.exports = router;
