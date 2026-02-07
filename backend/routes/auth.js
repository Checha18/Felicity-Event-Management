const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Participant = require('../models/participant');
const Organizer = require('../models/organizer');
const Admin = require('../models/admin');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper function to generate JWT token
 * @param {object} payload - User data to include in token
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' } // Token expires in 7 days
  );
};

/**
 * POST /api/auth/register
 * Register a new participant (IIIT or Non-IIIT)
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      participantType, 
      collegeName, 
      contactNumber, 
      password 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !participantType || !collegeName || !contactNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Validate IIIT email domain
    if (participantType === 'IIIT') {
      if (!email.endsWith('@iiit.ac.in') && !email.endsWith('@students.iiit.ac.in') && !email.endsWith('@research.iiit.ac.in')) {
        return res.status(400).json({
          success: false,
          message: 'IIIT participants must use @iiit.ac.in email address.'
        });
      }
    }

    // Check if user already exists
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new participant
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

    // Generate JWT token
    const token = generateToken({
      userId: participant._id,
      email: participant.email,
      role: 'participant'
    });

    // Return success response (don't send password)
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
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
      message: 'Registration failed.',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login for all user types (Participant, Organizer, Admin)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required.'
      });
    }

    // Validate role
    if (!['participant', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified.'
      });
    }

    let user;
    let userRole;

    // Find user based on role
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

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if organizer is approved
    if (userRole === 'organizer' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please contact admin.'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: userRole === 'organizer' ? user.contactEmail : user.email,
      role: userRole
    });

    // Prepare user response based on role
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

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side should remove token)
 * This is mainly for logging purposes
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Since JWT is stateless, logout is handled client-side by removing token
    // This endpoint can be used for logging or additional cleanup if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify if token is still valid and get current user
 * Useful for maintaining session on page reload
 */
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
        message: 'User not found.'
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
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
});

module.exports = router;
