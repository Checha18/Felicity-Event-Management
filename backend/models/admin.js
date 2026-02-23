const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true
});

// create an index on the email field - enforce uniqueness, and improve query performance
adminSchema.index({ email: 1 });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
