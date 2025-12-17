const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const School = require('../models/School');
const Student = require('../models/Student');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const Parent = require('../models/Parent');
const Staff = require('../models/Staff');

// Apply authentication to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard Stats
// Admin only sees aggregate counts, not individual student/parent details
router.get('/dashboard', async (req, res) => {
  try {
    const schools = await School.countDocuments({ status: 'Active' });
    const managers = await Manager.countDocuments({ status: 'Active' });
    const routes = await Route.countDocuments({ isdeleted: false });
    // Aggregate counts only - no individual details
    const students = await Student.countDocuments({ isdelete: false });
    const drivers = await Driver.countDocuments({ status: { $ne: 'Deleted' } });
    const parents = await Parent.countDocuments({ status: 'Active' });
    const activeDrivers = await Driver.countDocuments({ 
      status: { $ne: 'Deleted' },
      latitude: { $ne: null },
      longitude: { $ne: null }
    });

    res.json({
      schools,
      managers,
      routes,
      students, // Count only
      drivers, // Count only
      parents, // Count only
      activeDrivers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all admins
router.get('/accounts', async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin account
router.post('/accounts', async (req, res) => {
  try {
    const { name, email, password, access, image } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const admin = new Admin({
      name,
      email,
      password,
      access: access || 'Admin',
      image: image || '/uploads/default-avatar.png'
    });

    await admin.save();
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({ message: 'Admin created successfully', admin: adminData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete admin
router.delete('/accounts/:id', async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update admin profile
router.put('/profile', async (req, res) => {
  try {
    const { name, email, image } = req.body;
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      admin.email = email;
    }

    if (name) admin.name = name;
    if (image) admin.image = image;
    admin.updatedAt = Date.now();

    await admin.save();
    const adminData = admin.toObject();
    delete adminData.password;

    res.json({ message: 'Profile updated successfully', admin: adminData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all managers
router.get('/managers', async (req, res) => {
  try {
    const managers = await Manager.find({})
      .select('-password')
      .populate('sid', 'name')
      .sort({ createdAt: -1 });
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create manager
router.post('/managers', async (req, res) => {
  try {
    const { name, email, password, sid, phone, image, permissions, isStaff } = req.body;

    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const manager = new Manager({
      name,
      email,
      password,
      sid,
      phone,
      image: image || '/uploads/default-avatar.png',
      permissions: permissions || [],
      isStaff: isStaff || false,
      status: 'Active'
    });

    await manager.save();
    const managerData = manager.toObject();
    delete managerData.password;

    res.status(201).json({ message: 'Manager created successfully', manager: managerData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update manager
router.put('/managers/:id', async (req, res) => {
  try {
    const { name, email, sid, phone, image, permissions, isStaff, status } = req.body;

    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    if (email && email !== manager.email) {
      const existingManager = await Manager.findOne({ email });
      if (existingManager) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      manager.email = email;
    }

    if (name) manager.name = name;
    if (sid) manager.sid = sid;
    if (phone !== undefined) manager.phone = phone;
    if (image) manager.image = image;
    if (permissions) manager.permissions = permissions;
    if (isStaff !== undefined) manager.isStaff = isStaff;
    if (status) manager.status = status;
    manager.updatedAt = Date.now();

    await manager.save();
    const managerData = manager.toObject();
    delete managerData.password;

    res.json({ message: 'Manager updated successfully', manager: managerData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete manager (suspend)
router.delete('/managers/:id', async (req, res) => {
  try {
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      { status: 'Suspended' },
      { new: true }
    );
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.json({ message: 'Manager suspended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all staff (across all schools)
router.get('/staff', async (req, res) => {
  try {
    const staff = await Staff.find({ isdelete: false })
      .select('-password')
      .populate('sid', 'name')
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reports data
router.get('/reports', async (req, res) => {
  try {
    const schools = await School.find({})
      .select('name city status')
      .sort({ name: 1 });
    
    const managers = await Manager.find({})
      .select('-password')
      .populate('sid', 'name')
      .sort({ createdAt: -1 });
    
    const staff = await Staff.find({ isdelete: false })
      .select('-password')
      .populate('sid', 'name')
      .sort({ createdAt: -1 });

    res.json({
      schools,
      managers,
      staff
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Note: Admin does not have direct access to student/parent details
// Admin only manages schools and managers
// Students and parents are managed by individual school managers

module.exports = router;

