require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in .env. Server cannot start.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./db');
const { startReminderScheduler } = require('./services/reminderScheduler');
const { initTransporter } = require('./services/emailService');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const registrationRoutes = require('./routes/registrations');
const notificationRoutes = require('./routes/notifications');
const checkinRoutes = require('./routes/checkins');

const app = express();

// ── CORS ──
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Logging ──
app.use(morgan('dev'));

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));

// ── Rate limiting ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Service Day Dashboard API is running');
});

// ── Routes ──
app.use('/auth', authLimiter, authRoutes);
app.use('/activities', activityRoutes);
app.use('/registrations', registrationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/checkins', checkinRoutes);

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 3000;

// ── Start server ──
async function start() {
  // Connect to MongoDB
  await connectDB();

  // Auto-seed if no users exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('📦 No users found — running seed...');
    const { execSync } = require('child_process');
    execSync('node seed.js', { cwd: __dirname, stdio: 'inherit' });
  } else {
    console.log(`📊 Database has ${userCount} users — skipping seed`);
  }

  // Initialize email transporter
  initTransporter();

  // Start reminder scheduler
  startReminderScheduler();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

  // Graceful shutdown
  function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
