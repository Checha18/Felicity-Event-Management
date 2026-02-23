const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    registrationType: {
        type: String,
        enum: ['Normal', 'Merchandise'],
        required: true
    },

    // for normal events
    customFormResponses: [{
        fieldName: String,
        response: String
    }],

    // for merchandise events
    selectedVariant: {
        type: String,
        default: null
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    totalAmount: {
        type: Number,
        default: 0
    },

    // payment proof (merchandise)
    paymentProof: {
        type: String,
        default: null
    },
    paymentProofUploadedAt: {
        type: Date,
        default: null
    },
    approvalNotes: {
        type: String,
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        default: null
    },

    registrationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['registered', 'attended', 'cancelled'],
        default: 'registered'
    },
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'pending_approval', 'approved', 'rejected'],
        default: 'not_required'
    },
    qrCode: {
        type: String,
        default: null
    },

    // attendance tracking
    attendedAt: {
        type: Date,
        default: null
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        default: null
    },
    manualOverride: {
        type: Boolean,
        default: false
    },
    manualOverrideReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// prevent duplicate registrations
registrationSchema.index({ participantId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
