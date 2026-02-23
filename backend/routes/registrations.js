const express = require('express');
const router = express.Router();
const multer = require('multer');
const Registration = require('../models/registration');
const Event = require('../models/event');
const { verifyToken, checkRole } = require('../middleware/auth');
const { generateTicketQR, verifyTicketQR } = require('../utils/qrcodeService');
const { sendTicketEmail } = require('../utils/emailService');
const { generateICalContent } = require('../utils/calendarService');

// multer: memory storage, images only, 5 MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
});

// register for an event
router.post('/', verifyToken, checkRole(['participant']), async (req, res) => {
    try {
        const { eventId, customFormResponses, selectedVariant, quantity } = req.body;
        const participantId = req.user.userId;

        // check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // check if event is published
        if (event.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Event is not open for registration'
            });
        }

        // check registration deadline
        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({
                success: false,
                message: 'Registration deadline has passed'
            });
        }

        // check if already registered
        const existingRegistration = await Registration.findOne({
            participantId,
            eventId,
            status: { $ne: 'cancelled' }
        });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event'
            });
        }

        // check if event is full
        const registrationCount = await Registration.countDocuments({
            eventId,
            status: { $ne: 'cancelled' }
        });

        if (registrationCount >= event.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'Event is full'
            });
        }

        // prepare registration data
        const registrationData = {
            participantId,
            eventId,
            registrationType: event.eventType
        };

        if (event.eventType === 'Normal') {
            registrationData.customFormResponses = customFormResponses || [];
            registrationData.totalAmount = event.participationFee || 0;
            registrationData.paymentStatus = 'not_required';
        } else if (event.eventType === 'Merchandise') {
            if (!selectedVariant) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a variant'
                });
            }

            const variant = event.variants.find(v => v.variantName === selectedVariant);
            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid variant selected'
                });
            }

            if (variant.stock < (quantity || 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }

            registrationData.selectedVariant = selectedVariant;
            registrationData.quantity = quantity || 1;
            registrationData.totalAmount = variant.price * (quantity || 1);
            // Merchandise: pending payment proof; no stock decrement, no QR, no email yet
            registrationData.paymentStatus = 'pending';
        }

        // create registration
        const registration = new Registration(registrationData);
        await registration.save();

        // For Normal events: generate QR and send email immediately
        if (event.eventType === 'Normal') {
            await registration.populate('eventId');
            await registration.populate('participantId', 'firstName lastName email');

            let qrCodeDataUrl = null;
            try {
                qrCodeDataUrl = await generateTicketQR({
                    ticketId: registration._id.toString(),
                    eventId: event._id.toString(),
                    eventName: event.name,
                    participantId: registration.participantId._id.toString(),
                    participantName: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
                    participantEmail: registration.participantId.email,
                    registrationDate: registration.registrationDate
                });

                registration.qrCode = qrCodeDataUrl;
                await registration.save();
            } catch (qrError) {
                console.error('Failed to generate QR code:', qrError);
            }

            try {
                await sendTicketEmail({
                    to: registration.participantId.email,
                    participant: registration.participantId,
                    event: registration.eventId,
                    registration: registration,
                    qrCodeDataUrl
                });
            } catch (emailError) {
                console.error('Failed to send ticket email:', emailError);
            }
        }

        res.status(201).json({
            success: true,
            message: event.eventType === 'Merchandise'
                ? 'Registration successful! Please upload your payment proof to complete the order.'
                : 'Registration successful',
            registration
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// upload payment proof (participant)
router.post('/:id/payment-proof', verifyToken, checkRole(['participant']), upload.single('paymentProof'), async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a payment proof image' });
        }

        const registration = await Registration.findOne({ _id: id, participantId });
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        if (registration.registrationType !== 'Merchandise') {
            return res.status(400).json({ success: false, message: 'Payment proof is only for merchandise orders' });
        }

        if (!['pending', 'rejected'].includes(registration.paymentStatus)) {
            return res.status(400).json({ success: false, message: 'Cannot upload proof for this registration' });
        }

        // Convert buffer to base64 data URL
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        registration.paymentProof = dataUrl;
        registration.paymentProofUploadedAt = new Date();
        registration.paymentStatus = 'pending_approval';
        registration.approvalNotes = null; // clear any previous rejection notes
        await registration.save();

        res.json({ success: true, message: 'Payment proof uploaded. Awaiting organizer approval.' });
    } catch (error) {
        console.error('Payment proof upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// get payment approvals for an event (organizer)
router.get('/event/:eventId/payment-approvals', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { eventId } = req.params;

        const registrations = await Registration.find({
            eventId,
            registrationType: 'Merchandise',
            status: { $ne: 'cancelled' }
        })
            .populate('participantId', 'firstName lastName email contactNumber')
            .sort({ paymentProofUploadedAt: -1, registrationDate: -1 });

        res.json({ success: true, count: registrations.length, registrations });
    } catch (error) {
        console.error('Error fetching payment approvals:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// approve a payment (organizer)
router.patch('/:id/approve-payment', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const registration = await Registration.findById(id)
            .populate('participantId', 'firstName lastName email')
            .populate('eventId');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        if (registration.paymentStatus !== 'pending_approval') {
            return res.status(400).json({ success: false, message: 'Registration is not pending approval' });
        }

        const event = registration.eventId;

        // Decrement stock
        const variant = event.variants.find(v => v.variantName === registration.selectedVariant);
        if (variant) {
            if (variant.stock < registration.quantity) {
                return res.status(400).json({ success: false, message: 'Insufficient stock' });
            }
            variant.stock -= registration.quantity;
            await event.save();
        }

        // Generate QR code
        let qrCodeDataUrl = null;
        try {
            qrCodeDataUrl = await generateTicketQR({
                ticketId: registration._id.toString(),
                eventId: event._id.toString(),
                eventName: event.name,
                participantId: registration.participantId._id.toString(),
                participantName: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
                participantEmail: registration.participantId.email,
                registrationDate: registration.registrationDate
            });
        } catch (qrError) {
            console.error('Failed to generate QR code:', qrError);
        }

        registration.paymentStatus = 'approved';
        registration.approvedAt = new Date();
        registration.approvedBy = organizerId;
        registration.qrCode = qrCodeDataUrl;
        await registration.save();

        // Send ticket email
        try {
            await sendTicketEmail({
                to: registration.participantId.email,
                participant: registration.participantId,
                event: registration.eventId,
                registration,
                qrCodeDataUrl
            });
        } catch (emailError) {
            console.error('Failed to send ticket email:', emailError);
        }

        res.json({ success: true, message: 'Payment approved. QR code generated and email sent.' });
    } catch (error) {
        console.error('Approve payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// reject a payment (organizer)
router.patch('/:id/reject-payment', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const registration = await Registration.findById(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        if (registration.paymentStatus !== 'pending_approval') {
            return res.status(400).json({ success: false, message: 'Registration is not pending approval' });
        }

        registration.paymentStatus = 'rejected';
        registration.approvalNotes = reason || 'Payment proof rejected';
        await registration.save();

        res.json({ success: true, message: 'Payment rejected.' });
    } catch (error) {
        console.error('Reject payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// scan QR code and record attendance (organizer)
router.post('/scan', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { qrData, eventId } = req.body;
        const organizerId = req.user.userId;

        if (!qrData || !eventId) {
            return res.status(400).json({ success: false, message: 'qrData and eventId are required' });
        }

        const parsed = verifyTicketQR(qrData);
        if (!parsed.valid) {
            return res.status(400).json({ success: false, message: 'Invalid QR code', result: 'invalid' });
        }

        if (parsed.eventId !== eventId) {
            return res.status(400).json({ success: false, message: 'QR code is for a different event', result: 'invalid' });
        }

        const registration = await Registration.findById(parsed.ticketId)
            .populate('participantId', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found', result: 'invalid' });
        }

        if (registration.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Registration has been cancelled', result: 'invalid' });
        }

        if (registration.status === 'attended') {
            return res.status(400).json({
                success: false,
                message: 'Already scanned',
                result: 'duplicate',
                participant: {
                    name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
                    email: registration.participantId.email,
                    attendedAt: registration.attendedAt
                }
            });
        }

        // For merchandise, ensure payment is approved
        if (registration.registrationType === 'Merchandise' && registration.paymentStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Merchandise payment not yet approved',
                result: 'invalid'
            });
        }

        registration.status = 'attended';
        registration.attendedAt = new Date();
        registration.scannedBy = organizerId;
        await registration.save();

        // Increment event attendance count if the field exists
        await Event.findByIdAndUpdate(eventId, { $inc: { attendanceCount: 1 } });

        res.json({
            success: true,
            result: 'valid',
            message: 'Attendance recorded',
            participant: {
                name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
                email: registration.participantId.email,
                variant: registration.selectedVariant || null,
                attendedAt: registration.attendedAt
            }
        });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// get attendance list for an event (organizer)
router.get('/event/:eventId/attendance', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { eventId } = req.params;

        const registrations = await Registration.find({
            eventId,
            status: { $ne: 'cancelled' }
        })
            .populate('participantId', 'firstName lastName email contactNumber participantType')
            .sort({ registrationDate: -1 });

        const attended = registrations.filter(r => r.status === 'attended');
        const notAttended = registrations.filter(r => r.status !== 'attended');

        res.json({
            success: true,
            total: registrations.length,
            attendedCount: attended.length,
            attended,
            notAttended
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// manually mark a participant as attended (organizer)
router.patch('/:id/manual-attendance', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const organizerId = req.user.userId;

        const registration = await Registration.findById(id)
            .populate('participantId', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        if (registration.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot mark cancelled registration as attended' });
        }

        if (registration.status === 'attended') {
            return res.status(400).json({ success: false, message: 'Already marked as attended' });
        }

        registration.status = 'attended';
        registration.attendedAt = new Date();
        registration.scannedBy = organizerId;
        registration.manualOverride = true;
        registration.manualOverrideReason = reason || 'Manual override by organizer';
        await registration.save();

        await Event.findByIdAndUpdate(registration.eventId, { $inc: { attendanceCount: 1 } });

        res.json({ success: true, message: 'Attendance marked manually.' });
    } catch (error) {
        console.error('Manual attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// get my registrations
router.get('/my-events', verifyToken, checkRole(['participant']), async (req, res) => {
    try {
        const participantId = req.user.userId;

        const registrations = await Registration.find({
            participantId,
            status: { $ne: 'cancelled' }
        })
            .populate({
                path: 'eventId',
                select: 'name eventType startDate endDate locationOfEvent participationFee organizerId',
                populate: { path: 'organizerId', select: 'organizerName' }
            })
            .sort({ registrationDate: -1 });

        res.json({
            success: true,
            registrations
        });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get registrations for an event (organizer only)
router.get('/event/:eventId', verifyToken, checkRole(['organizer', 'admin']), async (req, res) => {
    try {
        const { eventId } = req.params;

        const registrations = await Registration.find({
            eventId,
            status: { $ne: 'cancelled' }
        })
            .populate('participantId', 'firstName lastName email contactNumber participantType')
            .sort({ registrationDate: -1 });

        res.json({
            success: true,
            count: registrations.length,
            registrations
        });
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Download iCal file for registration
router.get('/:id/calendar', verifyToken, checkRole(['participant']), async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.user.userId;

        const registration = await Registration.findOne({
            _id: id,
            participantId
        })
            .populate('eventId')
            .populate('participantId', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        await registration.eventId.populate('organizerId', 'organizerName category contactEmail');

        const icalContent = generateICalContent(registration.eventId, registration);

        const filename = `${registration.eventId.name.replace(/[^a-z0-9]/gi, '_')}_ticket.ics`;
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.status(200).send(icalContent);
    } catch (error) {
        console.error('Error generating calendar file:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// cancel registration
router.delete('/:id', verifyToken, checkRole(['participant']), async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.user.userId;

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        const registration = await Registration.findOne({
            _id: id,
            participantId
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        if (registration.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Registration already cancelled'
            });
        }

        registration.status = 'cancelled';
        await registration.save();

        res.json({
            success: true,
            message: 'Registration cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling registration:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
