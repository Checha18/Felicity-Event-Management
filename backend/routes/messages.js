const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { verifyToken } = require('../middleware/auth');

// GET /api/messages/event/:eventId - Get all messages for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const messages = await Message.find({
      eventId,
      isDeleted: false
    })
    .sort({ createdAt: 1 }) // Oldest first
    .limit(100); // Limit to last 100 messages

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// GET /api/messages/stats/:eventId - Get message count for an event
router.get('/stats/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const totalMessages = await Message.countDocuments({
      eventId,
      isDeleted: false
    });

    res.json({
      success: true,
      stats: {
        totalMessages
      }
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message stats',
      error: error.message
    });
  }
});

module.exports = router;
