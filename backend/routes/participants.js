const express = require('express');
const router = express.Router();
const Participant = require('../models/participant');
const { verifyToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get current participant profile
router.get('/profile', verifyToken, checkRole('participant'), async (req, res) => {
    try {
        const participant = await Participant.findById(req.user.userId).select('-password');
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }
        res.json({ participant });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update participant profile
router.put('/profile', verifyToken, checkRole('participant'), async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, collegeName, interests } = req.body;

        const participant = await Participant.findById(req.user.userId);
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        // Update allowed fields
        if (firstName) participant.firstName = firstName;
        if (lastName) participant.lastName = lastName;
        if (contactNumber) participant.contactNumber = contactNumber;
        if (collegeName) participant.collegeName = collegeName;
        if (interests) participant.interests = interests;

        await participant.save();

        const updatedParticipant = await Participant.findById(req.user.userId).select('-password');
        res.json({
            message: 'Profile updated successfully',
            participant: updatedParticipant
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Change password
router.put('/change-password', verifyToken, checkRole('participant'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const participant = await Participant.findById(req.user.userId);
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, participant.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        participant.password = await bcrypt.hash(newPassword, salt);
        await participant.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Follow an organizer
router.post('/follow/:organizerId', verifyToken, checkRole('participant'), async (req, res) => {
    try {
        const participant = await Participant.findById(req.user.userId);
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        // Check if already following
        if (participant.followedClubs.includes(req.params.organizerId)) {
            return res.status(400).json({ message: 'Already following this organizer' });
        }

        participant.followedClubs.push(req.params.organizerId);
        await participant.save();

        res.json({ message: 'Successfully followed organizer', followedClubs: participant.followedClubs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Unfollow an organizer
router.delete('/follow/:organizerId', verifyToken, checkRole('participant'), async (req, res) => {
    try {
        const participant = await Participant.findById(req.user.userId);
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        participant.followedClubs = participant.followedClubs.filter(
            id => id.toString() !== req.params.organizerId
        );
        await participant.save();

        res.json({ message: 'Successfully unfollowed organizer', followedClubs: participant.followedClubs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
