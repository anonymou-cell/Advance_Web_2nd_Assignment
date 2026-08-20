const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendEmail, sendBulkEmails } = require('../services/emailService');
const templates = require('../services/emailTemplates');

const INTERVAL_MS = {
  '1_week': 7 * 24 * 60 * 60 * 1000,
  '3_days': 3 * 24 * 60 * 60 * 1000,
  '1_day': 1 * 24 * 60 * 60 * 1000
};

// GET /notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ sentAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications' });
  }
});

// POST /notifications/broadcast
router.post('/broadcast', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { message, activityId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    let activityTitle = null;
    let recipients = [];
    if (activityId) {
      const activity = await Activity.findById(activityId);
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      activityTitle = activity.title;
      const registrations = await Registration.find({ activityId, status: { $ne: 'cancelled' } });
      recipients = registrations.map(r => r.username);
    } else {
      const users = await User.find({ role: 'employee' });
      recipients = users.map(u => u.email);
    }
    const notification = new Notification({
      message: message.trim(), activityId: activityId || null, activityTitle, type: 'broadcast'
    });
    await notification.save();

    // Send broadcast emails with template
    const t = templates.broadcast(message.trim(), activityTitle);
    sendBulkEmails(recipients, t.subject, t.text, t.html);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send broadcast' });
  }
});

// POST /notifications/schedule
router.post('/schedule', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { activityId, interval } = req.body;
    if (!activityId || !INTERVAL_MS[interval]) {
      return res.status(400).json({ message: 'Valid activityId and interval are required' });
    }
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    const triggerAt = new Date(new Date(activity.date).getTime() - INTERVAL_MS[interval]);
    const notification = new Notification({
      message: `Scheduled reminder for "${activity.title}"`,
      activityId, activityTitle: activity.title, type: 'reminder', sentAt: triggerAt
    });
    await notification.save();

    // Send reminder emails with template
    const registrations = await Registration.find({ activityId, status: { $ne: 'cancelled' } });
    const recipients = registrations.map(r => r.username);
    const intervalLabel = interval.replace('_', ' ');
    const t = templates.reminder(activity, intervalLabel);
    sendBulkEmails(recipients, t.subject, t.text, t.html);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to schedule reminder' });
  }
});

// POST /notifications/remind/:participantId
router.post('/remind/:participantId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.participantId);
    if (!registration) return res.status(404).json({ message: 'Participant not found' });
    const activity = await Activity.findById(registration.activityId);
    const message = `Reminder: don't forget your upcoming activity${activity ? ' - ' + activity.title : ''}.`;
    const notification = new Notification({
      message, activityId: registration.activityId,
      activityTitle: activity ? activity.title : null,
      targetUsername: registration.username, type: 'reminder'
    });
    await notification.save();

    // Send reminder email with template
    const t = templates.reminder(activity || { title: 'Your Activity', date: 'TBA', time: 'TBA', location: 'TBA' }, 'soon');
    sendEmail(registration.username, t.subject, t.text, t.html);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reminder' });
  }
});

module.exports = router;
