const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
    required: true
  },
  collegeName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  interests: {
    type: [String],
    default: []
  },
  password: {
    type: String,
    required: true
  },
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Check for unique email across Admin and Organizer model before saving
participantSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('email')) {
    const Admin = mongoose.model('Admin');
    const Organizer = mongoose.model('Organizer');

    const [adminExists, organizerExists] = await Promise.all([
      Admin.findOne({ email: this.email }),
      Organizer.findOne({ email: this.email })
    ]);

    if (adminExists || organizerExists) {
      throw new Error('Email already exists');
    }
  }
  next();
});

module.exports = mongoose.model('Participant', participantSchema);
