const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Participant = require('../models/participant');
const Organizer = require('../models/organizer');
const Admin = require('../models/admin');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d'
  });
};

// TODO: add email verification before account activation
// register participant
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, participantType, collegeName, contactNumber, password } = req.body;

    if (!firstName || !lastName || !email || !participantType || !collegeName || !contactNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    // check IIIT email domain
    if (participantType === 'IIIT') {
      // FIXME: need to validate more email formats for research scholars
      if (!email.endsWith('@iiit.ac.in') && !email.endsWith('@students.iiit.ac.in') && !email.endsWith('@research.iiit.ac.in')) {
        return res.status(400).json({
          success: false,
          message: 'IIIT participants must use @iiit.ac.in email'
        });
      }
    }

    // check email uniqueness across all models
    // TODO: optimize this - hitting 3 collections is slow
    const existingParticipant = await Participant.findOne({ email });
    const existingOrganizer = await Organizer.findOne({ contactEmail: email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingParticipant || existingOrganizer || existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const participant = new Participant({
      firstName,
      lastName,
      email,
      participantType,
      collegeName,
      contactNumber,
      password: hashedPassword
    });

    await participant.save();
    console.log('New participant registered:', email);

    const token = generateToken({
      userId: participant._id,
      email: participant.email,
      role: 'participant'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: participant._id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        participantType: participant.participantType,
        role: 'participant',
        hasCompletedOnboarding: participant.hasCompletedOnboarding
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// login - HACK: checking all 3 models based on role param from frontend
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role required'
      });
    }

    if (!['participant', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    console.log('Login attempt:', role, email);

    let user;
    let userRole;

    // TODO: refactor this if-else chain, looks messy
    if (role === 'participant') {
      user = await Participant.findOne({ email });
      userRole = 'participant';
    } else if (role === 'organizer') {
      user = await Organizer.findOne({ contactEmail: email });
      userRole = 'organizer';
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
      userRole = 'admin';
    }

    if (!user) {
      console.log('User not found for role:', role);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // check organizer approval
    if (userRole === 'organizer' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval'
      });
    }

    console.log('Login successful:', userRole, email);

    const token = generateToken({
      userId: user._id,
      email: userRole === 'organizer' ? user.contactEmail : user.email,
      role: userRole
    });

    let userResponse;
    if (userRole === 'participant') {
      userResponse = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        participantType: user.participantType,
        role: 'participant',
        hasCompletedOnboarding: user.hasCompletedOnboarding
      };
    } else if (userRole === 'organizer') {
      userResponse = {
        id: user._id,
        organizerName: user.organizerName,
        category: user.category,
        email: user.contactEmail,
        role: 'organizer'
      };
    } else if (userRole === 'admin') {
      userResponse = {
        id: user._id,
        email: user.email,
        role: 'admin'
      };
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// verify token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    let user;
    if (role === 'participant') {
      user = await Participant.findById(userId).select('-password');
    } else if (role === 'organizer') {
      user = await Organizer.findById(userId).select('-password');
    } else if (role === 'admin') {
      user = await Admin.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
