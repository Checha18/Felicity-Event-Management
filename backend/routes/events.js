const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const Registration = require('../models/registration');
const Participant = require('../models/participant');
const Organizer = require('../models/organizer');
const { verifyToken, checkRole } = require('../middleware/auth');
const axios = require('axios');
const { generateICalContent } = require('../utils/calendarService');

// create event
router.post('/', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizerId: req.user.userId,
            status: 'draft'
        };

        // TODO: add better validation for merchandise events
        if (req.body.eventType === 'Merchandise' && (!req.body.variants || req.body.variants.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Merchandise events need at least one variant'
            });
        }

        const event = new Event(eventData);
        await event.save();
        await event.populate('organizerId', 'organizerName category contactEmail');

        res.status(201).json({
            success: true,
            message: 'Event created as draft',
            event
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get organizer's own events (all statuses) - must be before general GET /
router.get('/my-events', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const events = await Event.find({ organizerId: req.user.userId })
            .populate('organizerId', 'organizerName category contactEmail')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// aggregate stats across all organizer events
router.get('/my-events/stats', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const organizerId = req.user.userId;

        const events = await Event.find({ organizerId });
        const eventIds = events.map(e => e._id);

        const agg = await Registration.aggregate([
            { $match: { eventId: { $in: eventIds }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: null,
                    totalRegistrations: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalAttended: { $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] } }
                }
            }
        ]);

        const completedEvents = events.filter(e => e.status === 'closed');

        res.json({
            success: true,
            stats: {
                totalRegistrations: agg[0]?.totalRegistrations || 0,
                totalRevenue: agg[0]?.totalRevenue || 0,
                totalAttended: agg[0]?.totalAttended || 0,
                completedEvents: completedEvents.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// get all published events (public)
router.get('/', async (req, res) => {
    try {
        const filters = { status: 'published' };

        if (req.query.eventType) filters.eventType = req.query.eventType;
        if (req.query.eligibility) filters.eligibility = req.query.eligibility;
        if (req.query.tags) filters.tags = { $in: req.query.tags.split(',') };

        if (req.query.search) {
            // match event name OR organizer name
            const matchingOrganizers = await Organizer.find({
                organizerName: { $regex: req.query.search, $options: 'i' }
            }).select('_id');
            const organizerIds = matchingOrganizers.map(o => o._id);

            filters.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { organizerId: { $in: organizerIds } }
            ];
        }

        // Handle date range filter
        if (req.query.startDate || req.query.endDate) {
            filters.startDate = {};
            if (req.query.startDate) {
                filters.startDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.startDate.$lte = new Date(req.query.endDate);
            }
        }

        // Handle followed clubs filter (requires organizerId array)
        if (req.query.followedClubs) {
            const clubIds = req.query.followedClubs.split(',');
            filters.organizerId = { $in: clubIds };
        }

        let events = await Event.find(filters)
            .populate('organizerId', 'organizerName category contactEmail');

        // Handle preference-based sorting (if user interests/followed clubs provided)
        // personalized event ordering algorithm
        if (req.query.userInterests || req.query.userFollowedClubs) {
            const userInterests = req.query.userInterests ? req.query.userInterests.split(',') : [];
            const userFollowedClubs = req.query.userFollowedClubs ? req.query.userFollowedClubs.split(',') : [];

            // score events - followed clubs get +10, matching tags get +3 each
            events = events.map(event => {
                let score = 0;

                if (userFollowedClubs.includes(event.organizerId._id.toString())) {
                    score += 10;
                }

                if (event.tags && event.tags.length > 0) {
                    const matchingTags = event.tags.filter(tag =>
                        userInterests.some(interest =>
                            tag.toLowerCase().includes(interest.toLowerCase()) ||
                            interest.toLowerCase().includes(tag.toLowerCase())
                        )
                    );
                    score += matchingTags.length * 3;
                }

                return { ...event.toObject(), preferenceScore: score };
            });

            // TODO: consider event popularity in scoring too
            events.sort((a, b) => {
                if (b.preferenceScore !== a.preferenceScore) {
                    return b.preferenceScore - a.preferenceScore;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else {
            events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // trending events - top 5 by registrations in last 24h
        if (req.query.trending === 'true') {
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const trendingData = await Registration.aggregate([
                {
                    $match: {
                        registrationDate: { $gte: last24Hours },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: '$eventId',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 5
                }
            ]);

            const trendingEventIds = trendingData.map(item => item._id.toString());

            // Filter and sort events by trending order
            events = events
                .filter(event => trendingEventIds.includes(event._id.toString()))
                .sort((a, b) => {
                    const indexA = trendingEventIds.indexOf(a._id.toString());
                    const indexB = trendingEventIds.indexOf(b._id.toString());
                    return indexA - indexB;
                });
        }

        res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Download iCal file for event (calendar integration)
router.get('/:id/calendar', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizerId', 'organizerName category contactEmail');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Generate iCal content
        const icalContent = generateICalContent(event);

        // Set headers for file download
        const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}.ics`;
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.status(200).send(icalContent);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get event by id
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizerId', 'organizerName category contactEmail description');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// update event
router.put('/:id', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to edit this event'
            });
        }

        let allowedUpdates = {};

        if (event.status === 'draft') {
            // can update everything in draft
            const { name, description, eventType, eligibility, startDate, endDate,
                registrationDeadline, locationOfEvent, maxParticipants,
                participationFee, customForm, variants, purchaseLimit, tags } = req.body;

            allowedUpdates = {
                name, description, eventType, eligibility, startDate,
                endDate, registrationDeadline, locationOfEvent,
                maxParticipants, participationFee, customForm,
                variants, purchaseLimit, tags
            };

            Object.keys(allowedUpdates).forEach(key =>
                allowedUpdates[key] === undefined && delete allowedUpdates[key]
            );
        } else if (event.status === 'published') {
            // limited updates for published events
            const { description, registrationDeadline, maxParticipants } = req.body;
            if (description !== undefined) allowedUpdates.description = description;
            if (registrationDeadline !== undefined) allowedUpdates.registrationDeadline = registrationDeadline;
            if (maxParticipants !== undefined) allowedUpdates.maxParticipants = maxParticipants;
        } else {
            return res.status(400).json({
                success: false,
                message: `Cannot edit event with status: ${event.status}`
            });
        }

        Object.assign(event, allowedUpdates);
        await event.save();
        await event.populate('organizerId', 'organizerName category contactEmail');

        res.status(200).json({
            success: true,
            message: 'Event updated',
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// delete event
router.delete('/:id', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this event'
            });
        }

        if (event.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot delete ${event.status} events. Only drafts can be deleted.`
            });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Event deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// publish event
router.patch('/:id/publish', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to publish this event'
            });
        }

        if (event.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Event is already ${event.status}`
            });
        }

        event.status = 'published';
        await event.save();

        // Send Discord webhook notification if configured
        try {
            const organizer = await Organizer.findById(event.organizerId);

            if (organizer && organizer.discordWebhook) {
                const webhookUrl = organizer.discordWebhook.trim();

                // Format event dates
                const startDate = new Date(event.startDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const endDate = new Date(event.endDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Create Discord embed message
                const discordPayload = {
                    embeds: [{
                        title: `New Event Published: ${event.name}`,
                        description: event.description,
                        color: 0x000000,
                        fields: [
                            {
                                name: 'Event Type',
                                value: event.eventType,
                                inline: true
                            },
                            {
                                name: 'Eligibility',
                                value: event.eligibility,
                                inline: true
                            },
                            {
                                name: 'Fee',
                                value: `Rs.${event.participationFee || 0}`,
                                inline: true
                            },
                            {
                                name: 'Start Time',
                                value: startDate,
                                inline: false
                            },
                            {
                                name: 'End Time',
                                value: endDate,
                                inline: false
                            },
                            {
                                name: 'Location',
                                value: event.locationOfEvent,
                                inline: false
                            },
                            {
                                name: 'Registration Deadline',
                                value: new Date(event.registrationDeadline).toLocaleString('en-IN'),
                                inline: false
                            },
                            {
                                name: 'Max Participants',
                                value: event.maxParticipants ? event.maxParticipants.toString() : 'Unlimited',
                                inline: true
                            }
                        ],
                        footer: {
                            text: `By ${organizer.organizerName} | Felicity Event Management`
                        },
                        timestamp: new Date().toISOString()
                    }]
                };

                // fire and forget - don't wait for discord response
                axios.post(webhookUrl, discordPayload).catch(err => {
                    console.error('Discord webhook failed:', err.message);
                });
            }
        } catch (webhookError) {
            // webhook errors shouldn't break event publishing
            console.error('Discord webhook error:', webhookError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Event published',
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// change event status (organizer)
router.patch('/:id/status', verifyToken, checkRole(['organizer']), async (req, res) => {
    try {
        const { status } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const allowed = {
            published: ['ongoing', 'closed'],
            ongoing: ['closed']
        };

        if (!allowed[event.status] || !allowed[event.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from '${event.status}' to '${status}'`
            });
        }

        event.status = status;
        await event.save();

        res.json({ success: true, message: `Event marked as ${status}`, event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
