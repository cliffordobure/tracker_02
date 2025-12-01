const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker_app');
    console.log('Connected to MongoDB');

    // Check if admin already exists - delete and recreate to fix password
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists. Deleting and recreating to ensure correct password...');
      await Admin.deleteOne({ email: 'admin@example.com' });
    }

    // Create admin user
    // Don't hash password here - let the model's pre-save hook do it
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'admin123', // Model will hash this automatically
      access: 'Super Admin',
      status: 'Active'
    });

    await admin.save();
    console.log('\n✅ Admin created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

