const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const participantRoutes = require('./routes/participants');
const organizerRoutes = require('./routes/organizers');
const adminRoutes = require('./routes/admin');
const passwordResetRoutes = require('./routes/passwordReset');
const messageRoutes = require('./routes/messages');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Connect to MongoDB
connectDB();

// health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// error handler
app.use(errorHandler);

module.exports = app;
