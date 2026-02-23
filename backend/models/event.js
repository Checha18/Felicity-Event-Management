const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    eventType: {
        type: String,
        enum: ['Normal', 'Merchandise'],
        required: true
    },
    eligibility: {
        type: String,
        enum: ['IIIT Only', 'Non-IIIT', 'All'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    registrationDeadline: {
        type: Date,
        default: null
    },
    locationOfEvent: {
        type: String,
        required: true,
        trim: true
    },
    maxParticipants: {
        type: Number,
        required: true,
        min: 1
    },
    participationFee: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    customForm: [{
        fieldName: {
            type: String,
            required: true,
            trim: true
        },
        fieldType: {
            type: String,
            enum: ['text', 'textarea', 'dropdown', 'checkbox', 'file'],
            required: true
        },
        isRequired: {
            type: Boolean,
            default: false
        },
        options: [String]
    }],
    variants: [{
        variantName: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    purchaseLimit: {
        type: Number,
        min: 1,
        default: 1
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'ongoing', 'closed'],
        default: 'draft'
    },
    tags: [{
        type: String,
        trim: true
    }],
    attendanceCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// create indexes on organizerId, status, eventType and startDate
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ startDate: 1 });

// check if registration is still open
eventSchema.virtual('isRegistrationOpen').get(function () {
    const now = new Date();
    return this.status === 'published' && now < this.registrationDeadline;
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;