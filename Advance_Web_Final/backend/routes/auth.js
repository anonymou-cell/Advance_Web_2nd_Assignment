const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const templates = require('../services/emailTemplates');

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch current user' });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (role && role !== 'employee') {
      return res.status(403).json({
        message: 'Only employee registration is allowed. Contact an admin.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      role: 'employee'
    });

    await user.save();

    const token = generateToken(user);

    // Send welcome email
    const t = templates.welcome(user);
    sendEmail(user.email, t.subject, t.text, t.html);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

// POST /auth (login)
router.post('/', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required' });
    }

    if (role !== 'admin' && role !== 'employee') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email, password or role.' });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email, password or role.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: 'Selected role does not match this account.' });
    }

    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

module.exports = router;
