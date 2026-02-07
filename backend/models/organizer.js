const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  organizerName: {
    type: String,
    required: [true, 'Organizer name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Club', 'Council', 'Fest Team', 'Other'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactNumber: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  // Discord webhook for auto-posting events
  discordWebhook: {
    type: String,
    default: null
  },
  // Approval status (Admin approves organizers)
  isApproved: {
    type: Boolean,
    default: true // Auto-approved when created by admin
  },
  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Index for faster email lookups
organizerSchema.index({ contactEmail: 1 });

const Organizer = mongoose.model('Organizer', organizerSchema);

module.exports = Organizer;
