const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Admin = require('./models/admin');

/**
 * Script to create the first admin user
 * Run this once to set up the admin account
 * Usage: node seedAdmin.js
 */

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('If you want to create a new admin, delete the existing one first.');
      process.exit(0);
    }

    // Admin credentials (change these!)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.iiit.ac.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'; // CHANGE THIS!

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin
    const admin = new Admin({
      email: adminEmail,
      password: hashedPassword
    });

    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('==========================================');
    console.log('Admin Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('==========================================');
    console.log('⚠️  IMPORTANT: Change the password immediately after first login!');
    console.log('⚠️  Store these credentials securely!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
