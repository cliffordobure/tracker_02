const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Manager = require('../models/Manager');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Student = require('../models/Student');

router.use(authenticate);
router.use(authorize('manager'));

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    // First, update parents without a school ID to associate them with this manager's school
    // This fixes parents created before the school ID field was added
    await Parent.updateMany(
      { 
        status: 'Active',
        $or: [
          { sid: null },
          { sid: { $exists: false } }
        ]
      },
      { $set: { sid: req.user.sid } }
    );

    // Count parents associated with this school (by sid OR by having students in this school)
    const studentsInSchool = await Student.find({ 
      isdelete: false,
      sid: req.user.sid
    }).select('_id');
    
    const studentIds = studentsInSchool.map(s => s._id);
    
    // Count parents by school ID or by having students in this school
    const parents = await Parent.countDocuments({ 
      status: 'Active',
      $or: [
        { sid: req.user.sid },
        { students: { $in: studentIds } }
      ]
    });
    
    const students = await Student.countDocuments({ 
      isdelete: false,
      sid: req.user.sid
    });
    
    const routes = await Route.countDocuments({ 
      isdeleted: false,
      sid: req.user.sid
    });
    
    const drivers = await Driver.countDocuments({ 
      status: { $ne: 'Deleted' },
      sid: req.user.sid
    });

    res.json({
      parents,
      students,
      routes,
      drivers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all parents
router.get('/parents', async (req, res) => {
  try {
    // First, update parents without a school ID to associate them with this manager's school
    // This fixes parents created before the school ID field was added
    await Parent.updateMany(
      { 
        status: 'Active',
        $or: [
          { sid: null },
          { sid: { $exists: false } }
        ]
      },
      { $set: { sid: req.user.sid } }
    );

    // Get parents associated with this school (by sid OR by having students in this school)
    const studentsInSchool = await Student.find({ 
      isdelete: false,
      sid: req.user.sid
    }).select('_id');
    
    const studentIds = studentsInSchool.map(s => s._id);
    
    const parents = await Parent.find({ 
      status: 'Active',
      $or: [
        { sid: req.user.sid },
        { students: { $in: studentIds } }
      ]
    })
      .select('-password')
      .populate('students', 'name')
      .sort({ createdAt: -1 });

    res.json(parents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create parent
router.post('/parents', async (req, res) => {
  try {
    const { name, email, password, phone, photo } = req.body;

    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const parent = new Parent({
      name,
      email,
      password,
      phone,
      photo: photo || '/uploads/default-avatar.png',
      sid: req.user.sid // Associate parent with manager's school
    });

    await parent.save();
    const parentData = parent.toObject();
    delete parentData.password;

    res.status(201).json({ message: 'Parent created successfully', parent: parentData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find({ 
      sid: req.user.sid,
      status: { $ne: 'Deleted' }
    })
      .select('-password')
      .populate('currentRoute', 'name')
      .sort({ createdAt: -1 });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create driver
router.post('/drivers', async (req, res) => {
  try {
    const { name, email, password, phone, photo, licenseNumber, vehicleNumber } = req.body;

    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const driver = new Driver({
      name,
      email,
      password,
      phone,
      photo: photo || '/uploads/default-driver.png',
      sid: req.user.sid,
      licenseNumber,
      vehicleNumber
    });

    await driver.save();
    const driverData = driver.toObject();
    delete driverData.password;

    res.status(201).json({ message: 'Driver created successfully', driver: driverData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver
router.put('/drivers/:id', async (req, res) => {
  try {
    const { name, email, phone, photo, licenseNumber, vehicleNumber, status } = req.body;

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (driver.sid.toString() !== req.user.sid.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name) driver.name = name;
    if (email && email !== driver.email) {
      const existingDriver = await Driver.findOne({ email });
      if (existingDriver) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      driver.email = email;
    }
    if (phone !== undefined) driver.phone = phone;
    if (photo) driver.photo = photo;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (vehicleNumber) driver.vehicleNumber = vehicleNumber;
    if (status) driver.status = status;
    driver.updatedAt = Date.now();

    await driver.save();
    const driverData = driver.toObject();
    delete driverData.password;

    res.json({ message: 'Driver updated successfully', driver: driverData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete driver (soft delete)
router.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status: 'Deleted' },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

