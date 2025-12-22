const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
    const managers = await Manager.find({ isDeleted: { $ne: true } })
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

    const existingManager = await Manager.findOne({ email, isDeleted: { $ne: true } });
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

    const manager = await Manager.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    if (email && email !== manager.email) {
      const existingManager = await Manager.findOne({ email, isDeleted: { $ne: true } });
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

    const school = await School.findOne({ _id: sid, isDeleted: { $ne: true } });
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
    const schools = await School.find({ isDeleted: { $ne: true } })
      .select('name city status')
      .sort({ name: 1 });
    
    const managers = await Manager.find({ isDeleted: { $ne: true } })
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

// Get all parents (admin only - no data privacy restrictions)
router.get('/parents', async (req, res) => {
  try {
    const parents = await Parent.find({})
      .select('-password')
      .populate('students', 'name grade status')
      .populate('sid', 'name')
      .sort({ createdAt: -1 });
    res.json(parents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create parent (admin only)
router.post('/parents', async (req, res) => {
  try {
    const { name, email, password, phone, sid } = req.body;

    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const parent = new Parent({
      name,
      email,
      password,
      phone,
      sid: sid || null,
      status: 'Active'
    });

    await parent.save();
    const parentData = parent.toObject();
    delete parentData.password;

    res.status(201).json({ message: 'Parent created successfully', parent: parentData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update parent (admin only)
router.put('/parents/:id', async (req, res) => {
  try {
    const { name, email, phone, sid, status } = req.body;

    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    if (email && email !== parent.email) {
      const existingParent = await Parent.findOne({ email });
      if (existingParent) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      parent.email = email;
    }

    if (name) parent.name = name;
    if (phone !== undefined) parent.phone = phone;
    if (sid !== undefined) parent.sid = sid;
    if (status) parent.status = status;
    parent.updatedAt = Date.now();

    await parent.save();
    const parentData = parent.toObject();
    delete parentData.password;

    res.json({ message: 'Parent updated successfully', parent: parentData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete parent (admin only)
router.delete('/parents/:id', async (req, res) => {
  try {
    const parent = await Parent.findByIdAndDelete(req.params.id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students (admin only - no data privacy restrictions)
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({ isdelete: false })
      .populate('sid', 'name')
      .populate('route', 'name')
      .populate('parents', 'name email')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create student (admin only)
router.post('/students', async (req, res) => {
  try {
    const { name, grade, address, latitude, longitude, route, parents, sid, status } = req.body;

    if (!sid) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const student = new Student({
      name,
      sid,
      grade,
      address,
      latitude,
      longitude,
      route: route || undefined,
      parents: parents || [],
      status: status || 'Active'
    });

    await student.save();

    // Update parent's student list
    if (parents && parents.length > 0) {
      await Parent.updateMany(
        { _id: { $in: parents } },
        { $addToSet: { students: student._id } }
      );
    }

    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student (admin only)
router.put('/students/:id', async (req, res) => {
  try {
    const { name, grade, address, latitude, longitude, route, status, parents, sid } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Store old parents before updating
    const oldParentIds = student.parents ? student.parents.map(p => p.toString()) : [];

    if (name) student.name = name;
    if (grade) student.grade = grade;
    if (address !== undefined) student.address = address;
    if (latitude !== undefined) student.latitude = latitude;
    if (longitude !== undefined) student.longitude = longitude;
    if (route) student.route = route;
    if (status) student.status = status;
    if (sid) student.sid = sid;
    
    // Handle parents assignment
    if (parents !== undefined) {
      const newParentIds = Array.isArray(parents) 
        ? parents.filter(p => p).map(p => p.toString())
        : [];
      
      student.parents = newParentIds.map(id => new mongoose.Types.ObjectId(id));

      // Find parents that were removed
      const removedParentIds = oldParentIds.filter(pId => !newParentIds.includes(pId));
      
      // Find parents that were added
      const addedParentIds = newParentIds.filter(pId => !oldParentIds.includes(pId));

      // Remove student from parents that were unassigned
      if (removedParentIds.length > 0) {
        await Parent.updateMany(
          { _id: { $in: removedParentIds } },
          { $pull: { students: student._id } }
        );
      }

      // Add student to newly assigned parents
      if (addedParentIds.length > 0) {
        await Parent.updateMany(
          { _id: { $in: addedParentIds } },
          { $addToSet: { students: student._id } }
        );
      }
    }

    student.updatedAt = Date.now();
    await student.save();

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete student (admin only - soft delete)
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isdelete: true, updatedAt: Date.now() },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all drivers (admin only)
router.get('/drivers', async (req, res) => {
  try {
    const { status } = req.query;
    let query = { status: { $ne: 'Deleted' } };
    
    if (status && (status === 'Active' || status === 'Suspended')) {
      query.status = status;
    }
    
    const drivers = await Driver.find(query)
      .select('-password')
      .populate('sid', 'name')
      .populate('currentRoute', 'name')
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver status (admin only)
router.put('/drivers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || (status !== 'Active' && status !== 'Suspended')) {
      return res.status(400).json({ message: 'Invalid status. Must be Active or Suspended' });
    }
    
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    driver.status = status;
    driver.updatedAt = Date.now();
    await driver.save();
    
    const driverData = driver.toObject();
    delete driverData.password;
    
    res.json({ message: `Driver ${status.toLowerCase()} successfully`, driver: driverData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Note: Admin now has full access to manage parents and students
// Detailed student and parent management is also handled by individual school managers

// Get inbox messages (messages TO admin)
router.get('/messages/inbox', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { fromType } = req.query;
    
    const query = {
      to: 'admin',
      toId: req.user._id,
      isdelete: false
    };
    
    if (fromType && fromType !== 'all') {
      query.from = fromType;
    }
    
    const messages = await Message.find(query)
      .populate('fromId', 'name email')
      .populate('toId', 'name email')
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get outbox messages (messages FROM admin)
router.get('/messages/outbox', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { toType } = req.query;
    
    const query = {
      from: 'admin',
      fromId: req.user._id,
      isdelete: false
    };
    
    if (toType && toType !== 'all') {
      query.to = toType;
    }
    
    const messages = await Message.find(query)
      .populate('fromId', 'name email')
      .populate('toId', 'name email')
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark message as read
router.put('/messages/:id/read', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    res.json({ message: 'Message marked as read', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reply to message
router.post('/messages/:id/reply', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { message: replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({ message: 'Reply message is required' });
    }
    
    const originalMessage = await Message.findById(req.params.id);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Original message not found' });
    }
    
    const reply = new Message({
      from: 'admin',
      fromId: req.user._id,
      fromName: req.user.name,
      to: originalMessage.from,
      toId: originalMessage.fromId,
      toName: originalMessage.fromName,
      subject: `Re: ${originalMessage.subject}`,
      message: replyText,
      type: 'direct',
      parentMessageId: originalMessage._id,
      studentId: originalMessage.studentId
    });
    
    await reply.save();
    
    // Mark original as read
    originalMessage.isRead = true;
    originalMessage.readAt = new Date();
    await originalMessage.save();
    
    res.status(201).json({ message: 'Reply sent successfully', data: reply });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

