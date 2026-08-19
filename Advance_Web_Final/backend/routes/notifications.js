const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { requireAuth, requireRole } = require('../middleware/auth');

const notificationsPath = path.join(__dirname, '../data/notifications.json');
const schedulesPath = path.join(__dirname, '../data/scheduled-reminders.json');
const activitiesPath = path.join(__dirname, '../data/activities.json');
const registrationsPath = path.join(__dirname, '../data/registrations.json');
const usersPath = path.join(__dirname, '../data/users.json');

// SMTP transporter for the real email notifications required by the brief.
// Configure via .env: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.
// If those aren't set, emails are skipped (JSON notifications still work)
// so the app keeps running in a fresh checkout without SMTP credentials.
const transporter = process.env.EMAIL_USER
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null;

async function sendEmail(to, subject, text) {
  if (!transporter || !to) {
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

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

const INTERVAL_MS = {
  '1_week': 7 * 24 * 60 * 60 * 1000,
  '3_days': 3 * 24 * 60 * 60 * 1000,
  '1_day': 1 * 24 * 60 * 60 * 1000
};

// registration.username is the employee's login email in this app, but
// older seed data uses placeholder usernames - fall back to the users.json
// record so real accounts still get a real email address.
async function resolveEmail(username) {
  if (username && username.includes('@')) {
    return username;
  }
  const users = await readJson(usersPath);
  const user = users.find(u => u.email.toLowerCase() === String(username).toLowerCase());
  return user ? user.email : null;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await readJson(notificationsPath);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications' });
  }
});

router.post('/broadcast', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { message, activityId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let activityTitle = null;
    let recipients = [];

    if (activityId) {
      const activities = await readJson(activitiesPath);
      const activity = activities.find(a => a.id === activityId);

      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      activityTitle = activity.title;

      const registrations = await readJson(registrationsPath);
      recipients = registrations
        .filter(r => r.activityId === activityId && r.status !== 'cancelled')
        .map(r => r.username);
    } else {
      const users = await readJson(usersPath);
      recipients = users.filter(u => u.role === 'employee').map(u => u.email);
    }

    const notifications = await readJson(notificationsPath);

    const newNotification = {
      id: Date.now().toString(),
      message: message.trim(),
      activityId: activityId || null,
      activityTitle,
      type: 'broadcast',
      sentAt: new Date().toISOString()
    };

    notifications.unshift(newNotification);
    await writeJson(notificationsPath, notifications);

    const subject = activityTitle ? `Update: ${activityTitle}` : 'Service Day announcement';
    await Promise.all(
      recipients.map(async (username) => {
        const email = await resolveEmail(username);
        return sendEmail(email, subject, message.trim());
      })
    );

    res.status(201).json(newNotification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send broadcast' });
  }
});

router.post('/schedule', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { activityId, interval } = req.body;

    if (!activityId || !INTERVAL_MS[interval]) {
      return res.status(400).json({ message: 'Valid activityId and interval are required' });
    }

    const activities = await readJson(activitiesPath);
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const triggerAt = new Date(new Date(activity.date).getTime() - INTERVAL_MS[interval]);

    const schedules = await readJson(schedulesPath);

    const newSchedule = {
      id: Date.now().toString(),
      activityId,
      activityTitle: activity.title,
      interval,
      triggerAt: triggerAt.toISOString(),
      fired: false
    };

    schedules.push(newSchedule);
    await writeJson(schedulesPath, schedules);

    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to schedule reminder' });
  }
});

router.post('/remind/:participantId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const registrations = await readJson(registrationsPath);
    const registration = registrations.find(r => r.id === req.params.participantId);

    if (!registration) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const activities = await readJson(activitiesPath);
    const activity = activities.find(a => a.id === registration.activityId);

    const notifications = await readJson(notificationsPath);

    const message = `Reminder: don't forget your upcoming activity${activity ? ' - ' + activity.title : ''}.`;

    const newNotification = {
      id: Date.now().toString(),
      message,
      activityId: registration.activityId,
      activityTitle: activity ? activity.title : null,
      targetUsername: registration.username,
      type: 'reminder',
      sentAt: new Date().toISOString()
    };

    notifications.unshift(newNotification);
    await writeJson(notificationsPath, notifications);

    const email = await resolveEmail(registration.username);
    await sendEmail(email, activity ? `Reminder: ${activity.title}` : 'Activity reminder', message);

    res.status(201).json(newNotification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reminder' });
  }
});

async function processScheduledReminders() {
  try {
    const schedules = await readJson(schedulesPath);
    const now = new Date();
    let changed = false;

    for (const schedule of schedules) {
      if (!schedule.fired && new Date(schedule.triggerAt) <= now) {
        const notifications = await readJson(notificationsPath);
        const message = `Reminder: "${schedule.activityTitle}" is coming up.`;

        notifications.unshift({
          id: Date.now().toString(),
          message,
          activityId: schedule.activityId,
          activityTitle: schedule.activityTitle,
          type: 'reminder',
          sentAt: new Date().toISOString()
        });

        await writeJson(notificationsPath, notifications);

        const registrations = await readJson(registrationsPath);
        const recipients = registrations
          .filter(r => r.activityId === schedule.activityId && r.status !== 'cancelled')
          .map(r => r.username);

        await Promise.all(
          recipients.map(async (username) => {
            const email = await resolveEmail(username);
            return sendEmail(email, `Reminder: ${schedule.activityTitle}`, message);
          })
        );

        schedule.fired = true;
        changed = true;
      }
    }

    if (changed) {
      await writeJson(schedulesPath, schedules);
    }
  } catch (err) {
    console.error('Scheduled reminder check failed:', err.message);
  }
}

setInterval(processScheduledReminders, 60 * 1000);

module.exports = router;