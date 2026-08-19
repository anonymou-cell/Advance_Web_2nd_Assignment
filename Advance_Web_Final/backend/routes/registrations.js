const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');

const registrationsPath = path.join(__dirname, '../data/registrations.json');
const activitiesPath = path.join(__dirname, '../data/activities.json');

async function readJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

router.get('/', requireAuth, async (req, res) => {
  try {
    let registrations = await readJson(registrationsPath);

    const { activityId, username, status } = req.query;

    if (activityId) {
      registrations = registrations.filter(r => r.activityId === activityId);
    }

    if (username) {
      registrations = registrations.filter(
        r => r.username.toLowerCase() === String(username).toLowerCase()
      );
    }

    if (status) {
      registrations = registrations.filter(r => r.status === status);
    }

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations' });
  }
});

router.get('/mine/:username', requireAuth, async (req, res) => {
  try {
    const registrations = await readJson(registrationsPath);
    const mine = registrations.filter(r => r.username === req.params.username && r.status !== 'cancelled');
    res.json(mine);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your registrations' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { activityId, username, employeeName } = req.body;

    if (!activityId || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const activities = await readJson(activitiesPath);
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (new Date() > new Date(activity.cutOffDateTime)) {
      return res.status(400).json({ message: 'Registration cut-off has passed for this activity' });
    }

    if (activity.seatsTaken >= activity.maxSeats) {
      return res.status(400).json({ message: 'This activity is full' });
    }

    const registrations = await readJson(registrationsPath);

    const alreadyRegistered = registrations.find(
      r => r.activityId === activityId && r.username === username && r.status !== 'cancelled'
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You are already registered for this activity' });
    }

    const newRegistration = {
      id: Date.now().toString(),
      activityId,
      username,
      employeeName: employeeName || username,
      status: 'registered',
      registeredAt: new Date().toISOString()
    };

    registrations.push(newRegistration);
    activity.seatsTaken += 1;

    await writeJson(registrationsPath, registrations);
    await writeJson(activitiesPath, activities);

    res.status(201).json(newRegistration);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register' });
  }
});

router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const registrations = await readJson(registrationsPath);
    const registration = registrations.find(r => r.id === req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration already cancelled' });
    }

    const activities = await readJson(activitiesPath);
    const activity = activities.find(a => a.id === registration.activityId);

    if (activity && new Date() > new Date(activity.cutOffDateTime)) {
      return res.status(400).json({ message: 'Cannot cancel after the cut-off time' });
    }

    registration.status = 'cancelled';
    registration.cancelledAt = new Date().toISOString();

    if (activity && activity.seatsTaken > 0) {
      activity.seatsTaken -= 1;
    }

    await writeJson(registrationsPath, registrations);
    await writeJson(activitiesPath, activities);

    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel registration' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const registrations = await readJson(registrationsPath);
    const index = registrations.findIndex(r => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const registration = registrations[index];

    if (registration.status !== 'cancelled') {
      const activities = await readJson(activitiesPath);
      const activity = activities.find(a => a.id === registration.activityId);

      if (activity && activity.seatsTaken > 0) {
        activity.seatsTaken -= 1;
        await writeJson(activitiesPath, activities);
      }
    }

    registrations.splice(index, 1);
    await writeJson(registrationsPath, registrations);

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove registration' });
  }
});

module.exports = router;