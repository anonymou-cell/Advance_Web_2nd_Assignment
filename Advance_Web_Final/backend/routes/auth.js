const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

const filePath = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SALT_ROUNDS = 10;

async function readUsers() {
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

async function writeUsers(users) {
  await fs.writeFile(filePath, JSON.stringify(users, null, 2));
}

function toPublicUser(user) {
  const { password, ...publicUser } = user;
  return publicUser;
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    if (role !== 'admin' && role !== 'employee') {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    const users = await readUsers();

    const existing = users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return res.status(409).json({
        message: 'Email is already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    const user = {
      id: uuidv4(),
      fullName,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await writeUsers(users);

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: toPublicUser(user)
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to register user'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password and role are required'
      });
    }

    if (role !== 'admin' && role !== 'employee') {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    const users = await readUsers();

    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email, password or role.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email, password or role.'
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: 'Selected role does not match this account.'
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: toPublicUser(user)
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to log in'
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const users = await readUsers();

    const user = users.find(
      u => u.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(toPublicUser(user));
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to fetch current user'
    });
  }
});

module.exports = router;