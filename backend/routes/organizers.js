const express = require('express');
const router = express.Router();
const Organizer = require('../models/organizer');
const Event = require('../models/event');
const { verifyToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all organizers (public)
router.get('/', async (req, res) => {
    try {
        const organizers = await Organizer.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ organizers });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get organizer profile (authenticated) - MUST be before /:id route
router.get('/profile', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.user.userId).select('-password');

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        res.json({ organizer });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update organizer profile
router.put('/profile', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const { organizerName, description, contactNumber, discordWebhook } = req.body;

        const organizer = await Organizer.findById(req.user.userId);

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // update allowed fields
        if (organizerName) organizer.organizerName = organizerName;
        if (description) organizer.description = description;
        if (contactNumber !== undefined) organizer.contactNumber = contactNumber;
        if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

        await organizer.save();

        const updatedOrganizer = await Organizer.findById(req.user.userId).select('-password');
        res.json({ organizer: updatedOrganizer });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
});

// Change password
router.put('/change-password', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const organizer = await Organizer.findById(req.user.userId);

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // verify current password
        const isMatch = await bcrypt.compare(currentPassword, organizer.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // hash and update new password
        const salt = await bcrypt.genSalt(10);
        organizer.password = await bcrypt.hash(newPassword, salt);
        await organizer.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
});

// Get organizer by ID with their events (must be AFTER /profile routes)
router.get('/:id', async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.params.id).select('-password');

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // Get all events by this organizer
        const events = await Event.find({ organizerId: req.params.id })
            .sort({ startDate: -1 });

        // Separate upcoming and past events
        const now = new Date();
        const upcomingEvents = events.filter(event => new Date(event.startDate) > now);
        const pastEvents = events.filter(event => new Date(event.startDate) <= now);

        res.json({
            organizer,
            upcomingEvents,
            pastEvents
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
