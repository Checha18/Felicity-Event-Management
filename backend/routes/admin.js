const express = require('express');
const router = express.Router();
const Organizer = require('../models/organizer');
const Event = require('../models/event');
const Participant = require('../models/participant');
const Registration = require('../models/registration');
const { verifyToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get dashboard statistics
router.get('/stats', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const totalOrganizers = await Organizer.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalParticipants = await Participant.countDocuments();
        const totalRegistrations = await Registration.countDocuments();

        // additional stats
        const publishedEvents = await Event.countDocuments({ status: 'published' });
        const draftEvents = await Event.countDocuments({ status: 'draft' });

        res.json({
            success: true,
            stats: {
                totalOrganizers,
                totalEvents,
                totalParticipants,
                totalRegistrations,
                publishedEvents,
                draftEvents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

// Get all organizers
router.get('/organizers', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const query = {};
        if (req.query.search) {
            query.organizerName = { $regex: req.query.search, $options: 'i' };
        }

        const organizers = await Organizer.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        // TODO: optimize this - hitting DB for each organizer is slow with many orgs
        // get event count for each organizer
        const organizersWithStats = await Promise.all(
            organizers.map(async (org) => {
                const eventCount = await Event.countDocuments({ organizerId: org._id });
                return {
                    ...org.toObject(),
                    eventCount
                };
            })
        );

        res.json({
            success: true,
            organizers: organizersWithStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organizers',
            error: error.message
        });
    }
});

// Create new organizer
router.post('/organizers', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { organizerName, category, description, contactNumber } = req.body;

        if (!organizerName || !category || !description) {
            return res.status(400).json({
                success: false,
                message: 'Organizer name, category, and description are required'
            });
        }

        // auto-generate email - strip special chars and add domain
        const emailPrefix = organizerName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
        const contactEmail = `${emailPrefix}@iiit.ac.in`;

        const existingOrganizer = await Organizer.findOne({ contactEmail });
        if (existingOrganizer) {
            return res.status(400).json({
                success: false,
                message: `Email ${contactEmail} already exists. Please use a different organizer name.`
            });
        }

        // HACK: simple 8-char password generator, should make this configurable
        const generatePassword = () => {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };

        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        console.log('Created organizer with email:', contactEmail);

        const organizer = new Organizer({
            organizerName,
            category,
            description,
            contactEmail,
            contactNumber: contactNumber || '',
            password: hashedPassword,
            isApproved: true,
            createdBy: req.user.userId
        });

        await organizer.save();

        res.status(201).json({
            success: true,
            message: 'Organizer created successfully',
            organizer: {
                _id: organizer._id,
                organizerName: organizer.organizerName,
                category: organizer.category,
                contactEmail: organizer.contactEmail
            },
            credentials: {
                email: contactEmail,
                password: plainPassword // return plain password for admin to share
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create organizer',
            error: error.message
        });
    }
});

// Delete organizer
router.delete('/organizers/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.params.id);

        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: 'Organizer not found'
            });
        }

        // check if organizer has events
        const eventCount = await Event.countDocuments({ organizerId: req.params.id });

        if (eventCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete organizer. They have ${eventCount} event(s). Please delete their events first.`
            });
        }

        await Organizer.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Organizer deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete organizer',
            error: error.message
        });
    }
});

module.exports = router;
