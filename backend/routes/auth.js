const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
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

    const manager = await Manager.findOne({ email }).populate('sid');
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
      parent.deviceToken = req.body.deviceToken;
      await parent.save();
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        photo: parent.photo,
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
      driver.deviceToken = req.body.deviceToken;
      await driver.save();
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        photo: driver.photo,
        role: 'driver',
        sid: driver.sid
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

