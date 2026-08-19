const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');

const checkinsPath = path.join(__dirname, '../data/checkins.json');
const activitiesPath = path.join(__dirname, '../data/activities.json');
const registrationsPath = path.join(__dirname, '../data/registrations.json');

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

// GET /checkins?activityId=&username=
// Used by the admin live check-in view and by employees checking their own status
router.get('/', requireAuth, async (req, res) => {
  try {
    const { activityId, username } = req.query;
    let checkins = await readJson(checkinsPath);

    if (activityId) {
      checkins = checkins.filter(c => c.activityId === activityId);
    }

    if (username) {
      checkins = checkins.filter(
        c => c.username.toLowerCase() === String(username).toLowerCase()
      );
    }

    // Most recent first
    checkins.sort(
      (a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
    );

    res.json(checkins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load check-ins' });
  }
});

// POST /checkins
// body: { code?, activityId?, username, employeeName }
// Either the activity's short check-in code (from a scanned QR / manual entry)
// or a direct activityId can be supplied.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { code, activityId, username, employeeName } = req.body;

    if (!username || (!code && !activityId)) {
      return res.status(400).json({
        message: 'A check-in code (or activityId) and username are required'
      });
    }

    const activities = await readJson(activitiesPath);

    const activity = code
      ? activities.find(
          a => (a.checkInCode || '').toUpperCase() === String(code).trim().toUpperCase()
        )
      : activities.find(a => a.id === activityId);

    if (!activity) {
      return res.status(404).json({ message: 'Invalid or unrecognized check-in code' });
    }

    const registrations = await readJson(registrationsPath);
    const registration = registrations.find(
      r =>
        r.activityId === activity.id &&
        r.username.toLowerCase() === String(username).toLowerCase() &&
        r.status !== 'cancelled'
    );

    if (!registration) {
      return res.status(400).json({
        message: `You are not registered for "${activity.title}"`
      });
    }

    const checkins = await readJson(checkinsPath);

    const alreadyCheckedIn = checkins.find(
      c =>
        c.activityId === activity.id &&
        c.username.toLowerCase() === String(username).toLowerCase()
    );

    if (alreadyCheckedIn) {
      return res.status(409).json({
        message: `You are already checked in to "${activity.title}"`,
        checkin: alreadyCheckedIn
      });
    }

    const newCheckin = {
      id: Date.now().toString(),
      activityId: activity.id,
      activityTitle: activity.title,
      username,
      employeeName: employeeName || registration.employeeName || username,
      checkedInAt: new Date().toISOString()
    };

    checkins.push(newCheckin);
    await writeJson(checkinsPath, checkins);

    res.status(201).json(newCheckin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check in' });
  }
});

// DELETE /checkins/:id  (admin: undo an accidental check-in)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const checkins = await readJson(checkinsPath);
    const index = checkins.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    checkins.splice(index, 1);
    await writeJson(checkinsPath, checkins);

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove check-in' });
  }
});

module.exports = router;
