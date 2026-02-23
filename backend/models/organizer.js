const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  organizerName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Club', 'Council', 'Fest Team', 'Other'],
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  contactNumber: {
    type: String,
    match: [/^[0-9]{10}$/, 'Invalid phone number']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  discordWebhook: {
    type: String,
    default: null
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// create an index on the contactEmail field
organizerSchema.index({ contactEmail: 1 });

const Organizer = mongoose.model('Organizer', organizerSchema);

module.exports = Organizer;
