const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendBulkEmails } = require('../services/emailService');
const templates = require('../services/emailTemplates');

// GET /activities
router.get('/', requireAuth, async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load activities' });
  }
});

// GET /activities/:id/qr
router.get('/:id/qr', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    const qrData = JSON.stringify({ activityId: activity._id, checkInCode: activity.checkInCode });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    res.json({ activityId: activity._id, checkInCode: activity.checkInCode, qrCode: qrCodeDataUrl });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
});

// GET /activities/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load activity' });
  }
});

// POST /activities (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { title, serviceType, location, description, date, time, maxSeats, cutOffDateTime } = req.body;
    if (!title || !location || !date || !maxSeats || !cutOffDateTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const seats = Number(maxSeats);
    if (isNaN(seats) || seats < 1) {
      return res.status(400).json({ message: 'maxSeats must be a positive number' });
    }
    const activity = new Activity({
      title, serviceType, location, description, date, time, maxSeats: seats, cutOffDateTime
    });
    await activity.save();

    // Notify all employees about new activity
    const employees = await User.find({ role: 'employee' });
    const recipients = employees.map(u => u.email);
    if (recipients.length > 0) {
      const t = templates.newActivity(activity);
      sendBulkEmails(recipients, t.subject, t.text, t.html);
    }

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create activity' });
  }
});

// PUT /activities/:id (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { title, serviceType, location, description, date, time, maxSeats, cutOffDateTime } = req.body;
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (title !== undefined) activity.title = title.trim();
    if (serviceType !== undefined) activity.serviceType = serviceType;
    if (location !== undefined) activity.location = location.trim();
    if (description !== undefined) activity.description = description;
    if (date !== undefined) activity.date = date;
    if (time !== undefined) activity.time = time;
    if (maxSeats !== undefined) activity.maxSeats = Number(maxSeats);
    if (cutOffDateTime !== undefined) activity.cutOffDateTime = cutOffDateTime;
    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update activity' });
  }
});

// DELETE /activities/:id (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete activity' });
  }
});

module.exports = router;
