const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['participant', 'organizer'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ eventId: 1, createdAt: -1 });
messageSchema.index({ eventId: 1, isDeleted: 1 });

module.exports = mongoose.model('Message', messageSchema);
