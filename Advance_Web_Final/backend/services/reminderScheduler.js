const cron = require('node-cron');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');
const { sendBulkEmails } = require('../services/emailService');
const templates = require('./emailTemplates');

async function checkReminders() {
  try {
    const now = new Date();
    const upcoming = await Activity.find({
      date: { $gte: now.toISOString().split('T')[0] }
    });

    for (const activity of upcoming) {
      const activityDate = new Date(activity.date);
      const daysUntil = Math.ceil((activityDate - now) / (1000 * 60 * 60 * 24));

      const intervals = [
        { days: 7, label: '1 week' },
        { days: 3, label: '3 days' },
        { days: 1, label: '1 day' }
      ];

      for (const interval of intervals) {
        if (daysUntil === interval.days) {
          const existing = await Notification.findOne({
            activityId: activity._id,
            type: 'reminder',
            message: { $regex: interval.label }
          });

          if (!existing) {
            const registrations = await Registration.find({
              activityId: activity._id, status: { $ne: 'cancelled' }
            });
            const message = `Reminder: "${activity.title}" is in ${interval.label}. Don't forget!`;
            const notification = new Notification({
              message, activityId: activity._id, activityTitle: activity.title, type: 'reminder'
            });
            await notification.save();

            // Send reminder emails with template
            const recipients = registrations.map(r => r.username);
            const t = templates.reminder(activity, interval.label);
            await sendBulkEmails(recipients, t.subject, t.text, t.html);

            console.log(`📧 Sent ${interval.label} reminder for "${activity.title}" to ${recipients.length} users`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Reminder check failed:', err.message);
  }
}

function startReminderScheduler() {
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Running reminder check...');
    checkReminders();
  });
  checkReminders();
  console.log('📅 Reminder scheduler started (runs every hour)');
}

module.exports = { startReminderScheduler };
