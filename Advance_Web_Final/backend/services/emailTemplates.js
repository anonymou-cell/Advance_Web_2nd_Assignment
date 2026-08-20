/**
 * Email Templates — Service Day Dashboard
 * All templates return { subject, text, html }
 */

const BRANDING = {
  name: 'Service Day',
  color: '#1d3557',
  accent: '#2563eb',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  bg: '#f8fafc',
  white: '#ffffff'
};

function wrap(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:${BRANDING.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRANDING.bg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:${BRANDING.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BRANDING.color};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;">📋 Service Day</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Service Day Dashboard &bull; Automated notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function badge(text, color) {
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

// ─── 1. Welcome Email ───
function welcome(user) {
  const subject = `Welcome to ${BRANDING.name}!`;
  const text = `Hi ${user.fullName},\n\nYour account has been created. You can now browse and register for community service activities.\n\nLogin at the Service Day Dashboard to get started.`;
  const html = wrap(`
    ${badge('Welcome', BRANDING.accent)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">Welcome, ${user.fullName}! 👋</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;">
      Your <strong>Service Day</strong> account has been created successfully.
      You can now browse and register for community service activities.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      ${infoRow('Email', user.email)}
      ${infoRow('Role', 'Employee')}
    </table>
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="http://localhost:4200" style="background:${BRANDING.accent};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open Dashboard →</a>
    </div>
  `);
  return { subject, text, html };
}

// ─── 2. Registration Confirmation ───
function registrationConfirmation(user, activity) {
  const subject = `✅ Registration Confirmed: ${activity.title}`;
  const text = `Hi ${user.fullName},\n\nYou have been registered for "${activity.title}".\n\nDate: ${activity.date}\nTime: ${activity.time || 'TBA'}\nLocation: ${activity.location}\n\nCut-off: ${new Date(activity.cutOffDateTime).toLocaleDateString()}\n\nPlease check in on the day of the event.`;
  const html = wrap(`
    ${badge('Registered', BRANDING.success)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">You're Registered! 🎉</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;">
      You have been successfully registered for:
    </p>
    <div style="background:#f0fdf4;border-left:4px solid ${BRANDING.success};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
      <h3 style="margin:0;color:${BRANDING.color};font-size:17px;">${activity.title}</h3>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${infoRow('📅 Date', activity.date)}
      ${infoRow('🕐 Time', activity.time || 'TBA')}
      ${infoRow('📍 Location', activity.location)}
      ${infoRow('💺 Seats', `${activity.seatsTaken}/${activity.maxSeats}`)}
      ${infoRow('⏰ Cut-off', new Date(activity.cutOffDateTime).toLocaleDateString())}
    </table>
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#1e40af;font-size:13px;">
        💡 <strong>Tip:</strong> Check in on the day using the QR code or manual code in the dashboard.
      </p>
    </div>
  `);
  return { subject, text, html };
}

// ─── 3. Check-in Confirmation ───
function checkinConfirmation(user, activity) {
  const subject = `✅ Checked In: ${activity.title}`;
  const text = `Hi ${user.fullName},\n\nYou have checked in to "${activity.title}".\n\nTime: ${new Date().toLocaleString()}\n\nThank you for participating!`;
  const html = wrap(`
    ${badge('Checked In', BRANDING.success)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">Check-in Successful! ✅</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;">
      You have been checked in to:
    </p>
    <div style="background:#f0fdf4;border-left:4px solid ${BRANDING.success};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
      <h3 style="margin:0;color:${BRANDING.color};font-size:17px;">${activity.title}</h3>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${infoRow('📅 Date', activity.date)}
      ${infoRow('📍 Location', activity.location)}
      ${infoRow('⏰ Checked in', new Date().toLocaleString())}
    </table>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0;color:#047857;font-size:15px;font-weight:600;">
        🙌 Thank you for participating in Service Day!
      </p>
    </div>
  `);
  return { subject, text, html };
}

// ─── 4. Broadcast Announcement ───
function broadcast(message, activityTitle) {
  const target = activityTitle ? ` regarding <strong>${activityTitle}</strong>` : ' to all employees';
  const subject = `📢 Service Day Announcement`;
  const text = `Service Day Announcement${activityTitle ? ' — ' + activityTitle : ''}:\n\n${message}`;
  const html = wrap(`
    ${badge('Announcement', BRANDING.accent)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">📢 New Announcement</h2>
    <p style="color:#64748b;font-size:13px;">Sent${target}</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.7;">${message}</p>
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="http://localhost:4200" style="background:${BRANDING.accent};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View in Dashboard →</a>
    </div>
  `);
  return { subject, text, html };
}

// ─── 5. Activity Reminder ───
function reminder(activity, daysLeft) {
  const subject = `⏰ Reminder: ${activity.title} — ${daysLeft}`;
  const text = `Reminder: "${activity.title}" is in ${daysLeft}.\n\nDate: ${activity.date}\nTime: ${activity.time || 'TBA'}\nLocation: ${activity.location}\n\nPlease check in on the day.`;
  const html = wrap(`
    ${badge('Reminder', BRANDING.warning)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">Upcoming Activity ⏰</h2>
    <div style="background:#fffbeb;border-left:4px solid ${BRANDING.warning};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
      <h3 style="margin:0;color:${BRANDING.color};font-size:17px;">${activity.title}</h3>
      <p style="margin:4px 0 0;color:#92400e;font-size:13px;">Happening in ${daysLeft}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${infoRow('📅 Date', activity.date)}
      ${infoRow('🕐 Time', activity.time || 'TBA')}
      ${infoRow('📍 Location', activity.location)}
    </table>
    <div style="background:#fffbeb;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#92400e;font-size:13px;">
        💡 <strong>Don't forget:</strong> Check in on the day using the QR code or manual entry.
      </p>
    </div>
  `);
  return { subject, text, html };
}

// ─── 6. Registration Cancelled ───
function registrationCancelled(user, activityTitle) {
  const subject = `❌ Registration Cancelled: ${activityTitle}`;
  const text = `Hi ${user.fullName},\n\nYour registration for "${activityTitle}" has been cancelled.\n\nIf this was a mistake, you can re-register before the cut-off date.`;
  const html = wrap(`
    ${badge('Cancelled', BRANDING.danger)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">Registration Cancelled</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;">
      Your registration for the following activity has been cancelled:
    </p>
    <div style="background:#fef2f2;border-left:4px solid ${BRANDING.danger};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
      <h3 style="margin:0;color:${BRANDING.color};font-size:17px;">${activityTitle}</h3>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      If this was a mistake, you can re-register before the cut-off date from the dashboard.
    </p>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="http://localhost:4200/employee/activities" style="background:${BRANDING.accent};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Browse Activities →</a>
    </div>
  `);
  return { subject, text, html };
}

// ─── 7. Removed by Admin ───
function removedByAdmin(user, activityTitle) {
  const subject = `❌ Removed from Activity: ${activityTitle}`;
  const text = `Hi ${user.fullName},\n\nAn administrator has removed your registration for "${activityTitle}".\n\nIf you believe this is an error, please contact your administrator.`;
  const html = wrap(`
    ${badge('Removed', BRANDING.danger)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">Removed from Activity</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;">
      An administrator has removed your registration for:
    </p>
    <div style="background:#fef2f2;border-left:4px solid ${BRANDING.danger};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
      <h3 style="margin:0;color:${BRANDING.color};font-size:17px;">${activityTitle}</h3>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      If you believe this is an error, please contact your administrator.
    </p>
  `);
  return { subject, text, html };
}

// ─── 8. New Activity Created ───
function newActivity(activity) {
  const subject = `🆕 New Activity: ${activity.title}`;
  const text = `A new activity has been created:\n\n"${activity.title}"\nLocation: ${activity.date}\nDate: ${activity.date}\nSeats: ${activity.maxSeats}\n\nRegistration deadline: ${new Date(activity.cutOffDateTime).toLocaleDateString()}\n\nLog in to register.`;
  const html = wrap(`
    ${badge('New Activity', BRANDING.accent)}
    <h2 style="margin:20px 0 8px;color:${BRANDING.color};font-size:20px;">New Activity Available! 🆕</h2>
    <div style="background:#eff6ff;border-left:4px solid ${BRANDING.accent};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
      <h3 style="margin:0;color:${BRANDING.color};font-size:17px;">${activity.title}</h3>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${infoRow('📍 Location', activity.location)}
      ${infoRow('📅 Date', activity.date)}
      ${infoRow('🕐 Time', activity.time || 'TBA')}
      ${infoRow('💺 Seats', activity.maxSeats)}
      ${infoRow('⏰ Register by', new Date(activity.cutOffDateTime).toLocaleDateString())}
    </table>
    ${activity.description ? `<p style="color:#64748b;font-size:14px;line-height:1.6;">${activity.description}</p>` : ''}
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="http://localhost:4200/employee/activities" style="background:${BRANDING.success};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Register Now →</a>
    </div>
  `);
  return { subject, text, html };
}

module.exports = {
  welcome,
  registrationConfirmation,
  checkinConfirmation,
  broadcast,
  reminder,
  registrationCancelled,
  removedByAdmin,
  newActivity
};
