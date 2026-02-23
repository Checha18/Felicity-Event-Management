const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Reason for password reset is required'],
    minlength: [10, 'Reason must be at least 10 characters'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminNotes: {
    type: String,
    maxlength: [300, 'Admin notes cannot exceed 300 characters']
  },
  newPassword: {
    type: String  // Store temporarily to display to admin
  }
}, {
  timestamps: true
});

// Index for faster queries
passwordResetRequestSchema.index({ organizerId: 1, status: 1 });
passwordResetRequestSchema.index({ requestedAt: -1 });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
