const mongoose = require('mongoose');
const User = require('./models/User');
const Activity = require('./models/Activity');
const Registration = require('./models/Registration');
const Notification = require('./models/Notification');
const Checkin = require('./models/Checkin');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceday';

// ── Seed Data ──

const users = [
  // Admins
  { fullName: 'Roshan Tamang', email: 'roshan@company.com', password: 'admin123', role: 'admin' },
  { fullName: 'Sabin Karki', email: 'sabin@company.com', password: 'admin123', role: 'admin' },

  // Employees
  { fullName: 'Sahil Shrestha', email: 'sahil@gmail.com', password: 'Sahil123', role: 'employee' },
  { fullName: 'Suman Kumar', email: 'suman@gmail.com', password: 'Suman123', role: 'employee' },
  { fullName: 'Alex Thompson', email: 'alex@company.com', password: 'Alex1234', role: 'employee' },
  { fullName: 'Maria Garcia', email: 'maria@company.com', password: 'Maria123', role: 'employee' },
  { fullName: 'James Wilson', email: 'james@company.com', password: 'James123', role: 'employee' },
  { fullName: 'Emily Chen', email: 'emily@company.com', password: 'Emily123', role: 'employee' },
  { fullName: 'David Kim', email: 'david@company.com', password: 'David123', role: 'employee' },
  { fullName: 'Sarah Johnson', email: 'sarah@company.com', password: 'Sarah123', role: 'employee' },
];

const crypto = require('crypto');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

const activities = [
  {
    title: 'Community Cleanup Drive',
    serviceType: 'Environment',
    location: 'Riverside Park, Downtown',
    description: 'Join us for a morning cleanup of the riverside park. We will provide gloves, bags, and refreshments.',
    date: '2026-09-15',
    time: '08:00',
    maxSeats: 30,
    seatsTaken: 12,
    cutOffDateTime: '2026-09-13T18:00:00'
  },
  {
    title: 'Blood Donation Camp',
    serviceType: 'Health',
    location: 'Community Health Center',
    description: 'Donate blood and save lives. Medical staff will be on-site. Light refreshments provided after donation.',
    date: '2026-09-20',
    time: '09:00',
    maxSeats: 25,
    seatsTaken: 18,
    cutOffDateTime: '2026-09-18T18:00:00'
  },
  {
    title: 'Tree Plantation Initiative',
    serviceType: 'Environment',
    location: 'Hillside Reserve, North District',
    description: 'Help us plant 200 trees in the hillside reserve. Tools and saplings provided.',
    date: '2026-09-25',
    time: '07:30',
    maxSeats: 40,
    seatsTaken: 8,
    cutOffDateTime: '2026-09-23T18:00:00'
  },
  {
    title: 'Food Bank Volunteering',
    serviceType: 'Community',
    location: 'City Food Bank Warehouse',
    description: 'Sort and pack food parcels for families in need. Great team-building activity.',
    date: '2026-10-01',
    time: '10:00',
    maxSeats: 20,
    seatsTaken: 5,
    cutOffDateTime: '2026-09-29T18:00:00'
  },
  {
    title: 'Elderly Care Home Visit',
    serviceType: 'Social',
    location: 'Sunshine Elderly Care Home',
    description: 'Spend time with elderly residents. Activities include reading, games, and conversation.',
    date: '2026-10-05',
    time: '14:00',
    maxSeats: 15,
    seatsTaken: 10,
    cutOffDateTime: '2026-10-03T18:00:00'
  },
  {
    title: 'Teaching at Orphanage',
    serviceType: 'Education',
    location: 'Hope Children Orphanage',
    description: 'Teach basic English and math to children aged 6-12. Materials provided.',
    date: '2026-10-10',
    time: '09:00',
    maxSeats: 10,
    seatsTaken: 7,
    cutOffDateTime: '2026-10-08T18:00:00'
  },
  {
    title: 'Beach Cleanup Marathon',
    serviceType: 'Environment',
    location: 'Sunset Beach',
    description: 'Combine fitness with community service. 5K run followed by beach cleanup.',
    date: '2026-10-15',
    time: '06:00',
    maxSeats: 50,
    seatsTaken: 3,
    cutOffDateTime: '2026-10-13T18:00:00'
  },
  {
    title: 'Disaster Relief Packaging',
    serviceType: 'Emergency',
    location: 'Red Cross Center',
    description: 'Pack emergency supply kits for disaster-affected regions.',
    date: '2026-10-20',
    time: '11:00',
    maxSeats: 35,
    seatsTaken: 0,
    cutOffDateTime: '2026-10-18T18:00:00'
  }
];

const notifications = [
  {
    message: 'Welcome to Service Day 2026! Check out the available activities and register before the cut-off date.',
    type: 'broadcast',
    sentAt: new Date('2026-08-01T09:00:00')
  },
  {
    message: 'Reminder: Community Cleanup Drive is next week. Don\'t forget to register!',
    type: 'reminder',
    sentAt: new Date('2026-09-08T09:00:00')
  },
  {
    message: 'Only 3 spots left for Blood Donation Camp. Register now!',
    type: 'broadcast',
    sentAt: new Date('2026-09-10T14:00:00')
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Activity.deleteMany({});
    await Registration.deleteMany({});
    await Notification.deleteMany({});
    await Checkin.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed users (save one by one so pre-save hook hashes passwords)
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`👥 Seeded ${createdUsers.length} users`);

    // Seed activities (add checkInCode for each)
    const activitiesWithCodes = activities.map(a => ({ ...a, checkInCode: generateCode() }));
    const createdActivities = await Activity.insertMany(activitiesWithCodes);
    console.log(`📋 Seeded ${createdActivities.length} activities`);

    // Seed registrations (link employees to activities)
    const employeeUsers = createdUsers.filter(u => u.role === 'employee');
    const registrations = [];

    // Assign registrations to match seatsTaken counts
    const assignmentMap = [
      { activityIdx: 0, count: 12 }, // Community Cleanup - 12 registered
      { activityIdx: 1, count: 18 }, // Blood Donation - 18 registered
      { activityIdx: 2, count: 8 },  // Tree Plantation - 8 registered
      { activityIdx: 3, count: 5 },  // Food Bank - 5 registered
      { activityIdx: 4, count: 10 }, // Elderly Care - 10 registered
      { activityIdx: 5, count: 7 },  // Teaching - 7 registered
      { activityIdx: 6, count: 3 },  // Beach Cleanup - 3 registered
    ];

    for (const assignment of assignmentMap) {
      for (let i = 0; i < assignment.count; i++) {
        const employee = employeeUsers[i % employeeUsers.length];
        registrations.push({
          activityId: createdActivities[assignment.activityIdx]._id,
          username: employee.email,
          employeeName: employee.fullName,
          status: 'registered',
          registeredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }
    }

    const createdRegistrations = await Registration.insertMany(registrations);
    console.log(`📝 Seeded ${createdRegistrations.length} registrations`);

    // Seed notifications
    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`🔔 Seeded ${createdNotifications.length} notifications`);

    // Seed some check-ins (for past activities)
    const checkins = [
      {
        activityId: createdActivities[0]._id,
        activityTitle: createdActivities[0].title,
        username: employeeUsers[0].email,
        employeeName: employeeUsers[0].fullName,
        checkedInAt: new Date('2026-09-15T08:15:00')
      },
      {
        activityId: createdActivities[0]._id,
        activityTitle: createdActivities[0].title,
        username: employeeUsers[1].email,
        employeeName: employeeUsers[1].fullName,
        checkedInAt: new Date('2026-09-15T08:20:00')
      },
      {
        activityId: createdActivities[1]._id,
        activityTitle: createdActivities[1].title,
        username: employeeUsers[2].email,
        employeeName: employeeUsers[2].fullName,
        checkedInAt: new Date('2026-09-20T09:10:00')
      }
    ];

    const createdCheckins = await Checkin.insertMany(checkins);
    console.log(`✅ Seeded ${createdCheckins.length} check-ins`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Admin:    roshan@company.com / admin123');
    console.log('   Employee: sahil@gmail.com / Sahil123');
    console.log('   Employee: suman@gmail.com / Suman123');

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
