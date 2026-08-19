require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');


const activityRoutes = require('./routes/activities');
const registrationRoutes = require('./routes/registrations');
const notificationRoutes = require('./routes/notifications');
const checkinRoutes = require('./routes/checkins');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Service Day Dashboard API is running');
});

app.use('/activities', activityRoutes);
app.use('/registrations', registrationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/checkins', checkinRoutes);
app.use('/auth', authRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});