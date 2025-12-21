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
const Noticeboard = require('../models/Noticeboard');
const Notification = require('../models/Notification');
const { getSocketIO } = require('../services/socketService');

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
    const managers = await Manager.find({ isDeleted: false })
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

    const existingManager = await Manager.findOne({ email, isDeleted: false });
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

    const manager = await Manager.findOne({ _id: req.params.id, isDeleted: false });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    if (email && email !== manager.email) {
      const existingManager = await Manager.findOne({ email, isDeleted: false });
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

// Soft delete manager
router.delete('/managers/:id', async (req, res) => {
  try {
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, updatedAt: Date.now() },
      { new: true }
    );
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.json({ message: 'Manager deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== NOTICEBOARD MANAGEMENT ====================

// Create notice for parents of a specific school
router.post('/notices', async (req, res) => {
  try {
    const { sid, title, message, category, priority, attachments } = req.body;

    if (!sid || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'School ID, title and message are required',
        error: 'MISSING_FIELDS'
      });
    }

    const school = await School.findOne({ _id: sid, isDeleted: false });
    if (!school) {
      return res.status(404).json({
        message: 'School not found',
        error: 'SCHOOL_NOT_FOUND'
      });
    }

    const notice = new Noticeboard({
      sid,
      studentId: null,
      title,
      message,
      category: category || 'general',
      priority: priority || 'normal',
      attachments: attachments || []
    });

    await notice.save();

    // Notify all parents in the school
    const students = await Student.find({ sid, isdelete: false }).populate('parents');
    const parentIds = new Set();

    students.forEach(student => {
      if (student.parents && student.parents.length > 0) {
        student.parents.forEach(parent => {
          if (parent && parent._id) {
            parentIds.add(parent._id.toString());
          }
        });
      }
    });

    const io = getSocketIO();

    for (const parentId of parentIds) {
      await Notification.create({
        pid: parentId,
        sid,
        message: `📢 New notice from ${school.name}: ${title}`,
        type: 'notice'
      });

      io.to(`parent:${parentId}`).emit('notification', {
        type: 'notice',
        noticeId: notice._id,
        title,
        message,
        school: {
          id: school._id,
          name: school.name
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Notice created successfully',
      data: {
        id: notice._id,
        title: notice.title,
        message: notice.message,
        category: notice.category,
        priority: notice.priority,
        school: {
          id: school._id,
          name: school.name
        },
        createdAt: notice.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating admin notice:', error);
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
    const schools = await School.find({ isDeleted: false })
      .select('name city status')
      .sort({ name: 1 });
    
    const managers = await Manager.find({ isDeleted: false })
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

// Note: Admin does not have direct access to individual student/parent records
// Admin manages schools, managers, and high-level notices
// Detailed student and parent management is handled by individual school managers

module.exports = router;

