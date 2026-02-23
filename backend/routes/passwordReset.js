const express = require('express');
const router = express.Router();
const PasswordResetRequest = require('../models/passwordResetRequest');
const Organizer = require('../models/organizer');
const { verifyToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Generate random password
function generatePassword(length = 10) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// ==================== ORGANIZER ROUTES ====================

// POST /api/password-reset/request - Organizer requests password reset
router.post('/request', verifyToken, checkRole(['organizer']), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters long'
      });
    }

    // Check if organizer already has a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizerId: req.user.userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    // Create new request
    const request = await PasswordResetRequest.create({
      organizerId: req.user.userId,
      reason: reason.trim()
    });

    const populatedRequest = await PasswordResetRequest.findById(request._id)
      .populate('organizerId', 'organizerName contactEmail category');

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Error creating password reset request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit password reset request',
      error: error.message
    });
  }
});

// GET /api/password-reset/my-requests - Get organizer's own requests
router.get('/my-requests', verifyToken, checkRole(['organizer']), async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({
      organizerId: req.user.userId
    })
    .populate('processedBy', 'email')
    .sort({ requestedAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// GET /api/password-reset/admin/requests - Get all requests (with filters)
router.get('/admin/requests', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await PasswordResetRequest.find(filter)
      .populate('organizerId', 'organizerName contactEmail category')
      .populate('processedBy', 'email')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
});

// PATCH /api/password-reset/admin/approve/:id - Approve request and reset password
router.patch('/admin/approve/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Generate new password
    const newPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update organizer's password
    await Organizer.findByIdAndUpdate(request.organizerId, {
      password: hashedPassword
    });

    // Update request
    request.status = 'approved';
    request.processedAt = new Date();
    request.processedBy = req.user.userId;
    request.adminNotes = adminNotes || '';
    request.newPassword = newPassword;  // Store temporarily
    await request.save();

    const populatedRequest = await PasswordResetRequest.findById(request._id)
      .populate('organizerId', 'organizerName contactEmail category')
      .populate('processedBy', 'email');

    res.json({
      success: true,
      message: 'Password reset approved and new password generated',
      request: populatedRequest,
      credentials: {
        email: populatedRequest.organizerId.contactEmail,
        newPassword: newPassword  // Return to admin to share with organizer
      }
    });
  } catch (error) {
    console.error('Error approving password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve password reset',
      error: error.message
    });
  }
});

// PATCH /api/password-reset/admin/reject/:id - Reject request
router.patch('/admin/reject/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Update request
    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = req.user.userId;
    request.adminNotes = adminNotes || 'Request rejected';
    await request.save();

    const populatedRequest = await PasswordResetRequest.findById(request._id)
      .populate('organizerId', 'organizerName contactEmail category')
      .populate('processedBy', 'email');

    res.json({
      success: true,
      message: 'Password reset request rejected',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Error rejecting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject password reset',
      error: error.message
    });
  }
});

// GET /api/password-reset/admin/stats - Get statistics
router.get('/admin/stats', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const totalRequests = await PasswordResetRequest.countDocuments();
    const pendingRequests = await PasswordResetRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await PasswordResetRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await PasswordResetRequest.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
