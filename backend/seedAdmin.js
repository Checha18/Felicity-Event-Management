const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Admin = require('./models/admin');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Delete the existing admin first if you want to create a new one.');
      process.exit(0);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.iiit.ac.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = new Admin({
      email: adminEmail,
      password: hashedPassword
    });

    await admin.save();

    console.log('Admin created successfully!');
    console.log('==========================================');
    console.log('Admin Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('==========================================');
    console.log('IMPORTANT: Change the password after first login!');

    process.exit(0);

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
