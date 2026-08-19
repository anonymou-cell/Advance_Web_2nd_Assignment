const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const { requireAuth, requireRole } = require('../middleware/auth');

const filePath = path.join(__dirname, '../data/activities.json');

function generateCheckInCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

async function readActivities() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const activities = data ? JSON.parse(data) : [];

    let changed = false;

    const existingCodes = new Set(
      activities
        .filter(a => a.checkInCode)
        .map(a => a.checkInCode)
    );

    for (const activity of activities) {
      if (!activity.checkInCode) {
        let code;

        do {
          code = generateCheckInCode();
        } while (existingCodes.has(code));

        existingCodes.add(code);
        activity.checkInCode = code;
        changed = true;
      }
    }

    if (changed) {
      await writeActivities(activities);
    }

    return activities;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }

    throw err;
  }
}

async function writeActivities(activities) {
  await fs.writeFile(
    filePath,
    JSON.stringify(activities, null, 2)
  );
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const activities = await readActivities();

    res.json(activities);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to load activities'
    });
  }
});

router.get('/:id/qr', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const activities = await readActivities();

    const activity = activities.find(
      a => a.id === req.params.id
    );

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    if (!activity.checkInCode) {
      return res.status(400).json({
        message: 'Check-in code not available'
      });
    }

    const qrData = JSON.stringify({
      activityId: activity.id,
      checkInCode: activity.checkInCode
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    res.json({
      activityId: activity.id,
      checkInCode: activity.checkInCode,
      qrCode: qrCodeDataUrl
    });

  } catch (err) {
    console.error('QR generation error:', err);

    res.status(500).json({
      message: 'Failed to generate QR code'
    });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const activities = await readActivities();

    const activity = activities.find(
      a => a.id === req.params.id
    );

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    res.json(activity);

  } catch (err) {
    res.status(500).json({
      message: 'Failed to load activity'
    });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const {
      title,
      serviceType,
      location,
      description,
      date,
      time,
      maxSeats,
      cutOffDateTime
    } = req.body;

    if (
      !title ||
      !location ||
      !date ||
      !maxSeats ||
      !cutOffDateTime
    ) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const activities = await readActivities();

    const existingCodes = new Set(
      activities
        .map(a => a.checkInCode)
        .filter(Boolean)
    );

    let checkInCode;

    do {
      checkInCode = generateCheckInCode();
    } while (existingCodes.has(checkInCode));

    const newActivity = {
      id: Date.now().toString(),
      title,
      serviceType: serviceType || '',
      location,
      description: description || '',
      date,
      time: time || '',
      maxSeats: Number(maxSeats),
      seatsTaken: 0,
      cutOffDateTime,
      checkInCode
    };

    activities.push(newActivity);

    await writeActivities(activities);

    res.status(201).json(newActivity);

  } catch (err) {
    res.status(500).json({
      message: 'Failed to create activity'
    });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const activities = await readActivities();

    const index = activities.findIndex(
      a => a.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    const updated = {
      ...activities[index],
      ...req.body,
      id: activities[index].id
    };

    activities[index] = updated;

    await writeActivities(activities);

    res.json(updated);

  } catch (err) {
    res.status(500).json({
      message: 'Failed to update activity'
    });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const activities = await readActivities();

    const index = activities.findIndex(
      a => a.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    activities.splice(index, 1);

    await writeActivities(activities);

    res.status(204).send();

  } catch (err) {
    res.status(500).json({
      message: 'Failed to delete activity'
    });
  }
});

module.exports = router;