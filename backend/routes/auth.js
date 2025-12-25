const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const Staff = require('../models/Staff');
const PasswordResetToken = require('../models/PasswordResetToken');
const { getPhotoUrl } = require('../utils/photoHelper');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper: get model by role
const getUserModelByRole = (role) => {
  switch (role) {
    case 'admin':
      return Admin;
    case 'manager':
      return Manager;
    case 'parent':
      return Parent;
    case 'driver':
      return Driver;
    case 'teacher':
      return Staff;
    default:
      return null;
  }
};

// Helper: create nodemailer transporter if SMTP is configured
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not fully configured - forgot password emails will be logged only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin.status !== 'Active') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    const token = generateToken(admin._id, 'admin');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        image: admin.image,
        role: 'admin',
        access: admin.access
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manager Login
router.post('/manager/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const manager = await Manager.findOne({ email, isDeleted: { $ne: true } }).populate('sid');
    if (!manager) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await manager.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (manager.status !== 'Active') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    const token = generateToken(manager._id, 'manager');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        image: manager.image,
        role: 'manager',
        sid: manager.sid,
        permissions: manager.permissions,
        isStaff: manager.isStaff
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Parent Login
router.post('/parent/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const parent = await Parent.findOne({ email });
    if (!parent) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await parent.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (parent.status !== 'Active') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    const token = generateToken(parent._id, 'parent');

    // Update device token if provided
    if (req.body.deviceToken) {
      const token = req.body.deviceToken.trim();
      
      // Validate token format (reject placeholder/test tokens)
      if (token.length < 50 || 
          token.toLowerCase() === 'device_token' || 
          token.toLowerCase() === 'test_token' ||
          token.toLowerCase().includes('placeholder') ||
          token === 'device_token') {
        console.warn(`⚠️  Invalid device token format for parent ${parent.email}. Token appears to be a placeholder.`);
        console.warn(`   Received: "${token}"`);
        console.warn(`   Real FCM tokens are 140+ character alphanumeric strings.`);
      } else {
        parent.deviceToken = token;
        await parent.save();
        console.log(`✅ Device token updated for parent ${parent.email} (${token.substring(0, 20)}...)`);
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        photo: getPhotoUrl(parent.photo),
        role: 'parent'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Driver Login
router.post('/driver/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email }).populate('sid');
    if (!driver) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (driver.status !== 'Active') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    const token = generateToken(driver._id, 'driver');

    // Update device token if provided
    if (req.body.deviceToken) {
      const token = req.body.deviceToken.trim();
      
      // Validate token format (reject placeholder/test tokens)
      if (token.length < 50 || 
          token.toLowerCase() === 'device_token' || 
          token.toLowerCase() === 'test_token' ||
          token.toLowerCase().includes('placeholder') ||
          token === 'device_token') {
        console.warn(`⚠️  Invalid device token format for driver ${driver.email}. Token appears to be a placeholder.`);
        console.warn(`   Received: "${token}"`);
        console.warn(`   Real FCM tokens are 140+ character alphanumeric strings.`);
      } else {
        driver.deviceToken = token;
        await driver.save();
        console.log(`✅ Device token updated for driver ${driver.email} (${token.substring(0, 20)}...)`);
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        photo: getPhotoUrl(driver.photo),
        role: 'driver',
        sid: driver.sid
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher Login
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Staff.findOne({ 
      email, 
      role: 'teacher',
      isdelete: false 
    }).populate('sid');

    if (!teacher) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await teacher.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (teacher.status !== 'Active') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    const token = generateToken(teacher._id, 'teacher');

    // Update device token if provided
    if (req.body.deviceToken) {
      const token = req.body.deviceToken.trim();
      
      // Validate token format (reject placeholder/test tokens)
      if (token.length < 50 || 
          token.toLowerCase() === 'device_token' || 
          token.toLowerCase() === 'test_token' ||
          token.toLowerCase().includes('placeholder') ||
          token === 'device_token') {
        console.warn(`⚠️  Invalid device token format for teacher ${teacher.email}. Token appears to be a placeholder.`);
        console.warn(`   Received: "${token}"`);
        console.warn(`   Real FCM tokens are 140+ character alphanumeric strings.`);
      } else {
        teacher.deviceToken = token;
        await teacher.save();
        console.log(`✅ Device token updated for teacher ${teacher.email} (${token.substring(0, 20)}...)`);
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        photo: getPhotoUrl(teacher.photo),
        role: 'teacher',
        sid: teacher.sid,
        assignedClass: teacher.assignedClass,
        phone: teacher.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PASSWORD RESET ====================

// Request password reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        message: 'Email and role are required',
        error: 'MISSING_FIELDS'
      });
    }

    const normalizedRole = role.toLowerCase();
    const UserModel = getUserModelByRole(normalizedRole);

    if (!UserModel) {
      return res.status(400).json({
        message: 'Invalid role',
        error: 'INVALID_ROLE'
      });
    }

    const user = await UserModel.findOne({ email });

    // Always respond with success message to avoid email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent'
      });
    }

    // Delete any existing tokens for this user/role
    await PasswordResetToken.deleteMany({ userId: user._id, role: normalizedRole });

    // Create reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      role: normalizedRole,
      token,
      expiresAt
    });

    const frontendBase =
      process.env.PASSWORD_RESET_URL ||
      (process.env.FRONTEND_URL && process.env.FRONTEND_URL.split(',')[0]) ||
      'http://localhost:3000';

    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}&role=${normalizedRole}`;

    const transporter = createTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"School Bus Tracker" <no-reply@schoolbustracker.com>`,
          to: user.email,
          subject: 'Password Reset Request',
          html: `
            <p>Hello ${user.name || ''},</p>
            <p>You requested to reset your password for the School Bus Tracker (${normalizedRole}) account.</p>
            <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
      }
    } else {
      console.log('Password reset URL (no email sent):', resetUrl);
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      // In development, return token & URL to simplify testing
      ...(process.env.NODE_ENV === 'development' && { token, resetUrl })
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, role, password } = req.body;

    if (!token || !role || !password) {
      return res.status(400).json({
        message: 'Token, role and new password are required',
        error: 'MISSING_FIELDS'
      });
    }

    const normalizedRole = role.toLowerCase();

    const resetToken = await PasswordResetToken.findOne({
      token,
      role: normalizedRole,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({
        message: 'Invalid or expired password reset token',
        error: 'INVALID_TOKEN'
      });
    }

    const UserModel = getUserModelByRole(normalizedRole);
    if (!UserModel) {
      return res.status(400).json({
        message: 'Invalid role',
        error: 'INVALID_ROLE'
      });
    }

    const user = await UserModel.findById(resetToken.userId);
    if (!user) {
      return res.status(400).json({
        message: 'User account not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    await user.save();

    // Remove all tokens for this user/role
    await PasswordResetToken.deleteMany({ userId: user._id, role: normalizedRole });

    res.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

