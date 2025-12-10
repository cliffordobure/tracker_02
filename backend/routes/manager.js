const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Manager = require('../models/Manager');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const DriverRating = require('../models/DriverRating');

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

// ==================== TEACHER MANAGEMENT ====================

// Get all teachers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Staff.find({ 
      sid: req.user.sid,
      role: 'teacher',
      isdelete: false
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create teacher
router.post('/teachers', async (req, res) => {
  try {
    const { name, email, password, phone, photo, assignedClass, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        error: 'INVALID_PASSWORD'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
    }

    // Check if school ID exists
    if (!req.user || !req.user.sid) {
      return res.status(400).json({ 
        message: 'Manager school ID not found',
        error: 'MISSING_SCHOOL_ID'
      });
    }

    // Check for existing teacher with case-insensitive email
    const existingTeacher = await Staff.findOne({ 
      email: email.toLowerCase().trim() 
    });
    if (existingTeacher) {
      return res.status(400).json({ 
        message: 'Email already exists',
        error: 'EMAIL_EXISTS'
      });
    }

    // Build teacher object
    const teacherData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : undefined,
      photo: photo || '/uploads/default-teacher.png',
      sid: req.user.sid,
      role: 'teacher',
      assignedClass: assignedClass || null,
      permissions: permissions || ['noticeboard', 'send', 'receive'],
      status: 'Active'
    };

    // Explicitly do NOT include fid field - it's not used in this system
    // The pre-save hook will ensure it's undefined if somehow set

    const teacher = new Staff(teacherData);
    
    // Explicitly unset fid to ensure it's not in the document
    teacher.fid = undefined;

    await teacher.save();
    const savedTeacher = teacher.toObject();
    delete savedTeacher.password;

    res.status(201).json({ message: 'Teacher created successfully', teacher: savedTeacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'This value already exists';
      
      // Provide specific messages for known fields
      if (field === 'email') {
        message = 'Email already exists';
      } else {
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      }
      
      return res.status(400).json({ 
        message: message,
        error: 'DUPLICATE_KEY',
        field
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: errors
      });
    }

    res.status(500).json({ 
      message: 'Server error while creating teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update teacher
router.put('/teachers/:id', async (req, res) => {
  try {
    const { name, email, phone, photo, assignedClass, permissions, status } = req.body;

    const teacher = await Staff.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.sid.toString() !== req.user.sid.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'This is not a teacher account' });
    }

    if (name) teacher.name = name;
    if (email && email !== teacher.email) {
      const existingTeacher = await Staff.findOne({ email });
      if (existingTeacher) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      teacher.email = email;
    }
    if (phone !== undefined) teacher.phone = phone;
    if (photo) teacher.photo = photo;
    if (assignedClass !== undefined) teacher.assignedClass = assignedClass;
    if (permissions) teacher.permissions = permissions;
    if (status) teacher.status = status;
    teacher.updatedAt = Date.now();

    await teacher.save();
    const teacherData = teacher.toObject();
    delete teacherData.password;

    res.json({ message: 'Teacher updated successfully', teacher: teacherData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete teacher (soft delete)
router.delete('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Staff.findByIdAndUpdate(
      req.params.id,
      { isdelete: true },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.sid.toString() !== req.user.sid.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== DRIVER RATINGS MANAGEMENT ====================

// Get all driver ratings with filtering, pagination, and sorting
router.get('/drivers/ratings', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      driverId,
      studentId,
      parentId,
      minRating,
      maxRating,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - filter by manager's school
    const query = {};
    
    // Get all drivers in manager's school
    const schoolDrivers = await Driver.find({ 
      sid: req.user.sid,
      status: { $ne: 'Deleted' }
    }).select('_id');
    const driverIds = schoolDrivers.map(d => d._id);
    
    // Only show ratings for drivers in manager's school
    query.driverId = { $in: driverIds };

    // Apply filters
    if (driverId) {
      // Verify driver belongs to manager's school
      const driver = await Driver.findOne({ 
        _id: driverId, 
        sid: req.user.sid,
        status: { $ne: 'Deleted' }
      });
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'Driver with ID does not exist or does not belong to your school'
        });
      }
      query.driverId = driverId;
    }

    if (studentId) {
      // Verify student belongs to manager's school
      const student = await Student.findOne({ 
        _id: studentId, 
        sid: req.user.sid,
        isdelete: false
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
          error: 'Student with ID does not exist or does not belong to your school'
        });
      }
      query.studentId = studentId;
    }

    if (parentId) {
      query.parentId = parentId;
    }

    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Build sort
    const sort = {};
    const validSortFields = ['rating', 'createdAt', 'driverName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // If sorting by driverName, we'll need to sort after population
    const shouldSortAfter = sortField === 'driverName';

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Count total items
    const totalItems = await DriverRating.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Fetch ratings with population
    let ratings = await DriverRating.find(query)
      .populate('driverId', 'name email phone photo vehicleNumber')
      .populate('parentId', 'name email')
      .populate('studentId', 'name grade')
      .sort(shouldSortAfter ? { createdAt: -1 } : sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Sort by driverName if needed
    if (shouldSortAfter) {
      ratings.sort((a, b) => {
        const nameA = a.driverId?.name || '';
        const nameB = b.driverId?.name || '';
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    // Calculate summary statistics
    const summaryAggregation = await DriverRating.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const summaryData = summaryAggregation[0] || {
      totalRatings: 0,
      averageRating: 0,
      ratingDistribution: []
    };

    // Format rating distribution
    const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    summaryData.ratingDistribution.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        distribution[rating.toString()]++;
      }
    });

    // Format response
    const formattedRatings = ratings.map(rating => ({
      id: rating._id.toString(),
      driver: rating.driverId ? {
        id: rating.driverId._id.toString(),
        name: rating.driverId.name,
        email: rating.driverId.email,
        phone: rating.driverId.phone,
        photo: rating.driverId.photo,
        vehicleNumber: rating.driverId.vehicleNumber
      } : null,
      parent: rating.parentId ? {
        id: rating.parentId._id.toString(),
        name: rating.parentId.name,
        email: rating.parentId.email
      } : null,
      student: rating.studentId ? {
        id: rating.studentId._id.toString(),
        name: rating.studentId.name,
        grade: rating.studentId.grade
      } : null,
      rating: rating.rating,
      comment: rating.comment || '',
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt
    }));

    res.json({
      success: true,
      message: 'Driver ratings retrieved successfully',
      data: formattedRatings,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      },
      summary: {
        totalRatings: summaryData.totalRatings,
        averageRating: summaryData.averageRating 
          ? Math.round(summaryData.averageRating * 10) / 10 
          : 0,
        ratingDistribution: distribution
      }
    });
  } catch (error) {
    console.error('Error fetching driver ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get driver ratings summary
router.get('/drivers/ratings/summary', async (req, res) => {
  try {
    const { driverId, startDate, endDate } = req.query;

    // Build query - filter by manager's school
    const query = {};
    
    // Get all drivers in manager's school
    const schoolDrivers = await Driver.find({ 
      sid: req.user.sid,
      status: { $ne: 'Deleted' }
    }).select('_id');
    const driverIds = schoolDrivers.map(d => d._id);
    
    query.driverId = { $in: driverIds };

    if (driverId) {
      // Verify driver belongs to manager's school
      const driver = await Driver.findOne({ 
        _id: driverId, 
        sid: req.user.sid,
        status: { $ne: 'Deleted' }
      });
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          error: 'Driver with ID does not exist or does not belong to your school'
        });
      }
      query.driverId = driverId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Overall summary
    const overallSummary = await DriverRating.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: { $push: '$rating' }
        }
      }
    ]);

    const overall = overallSummary[0] || {
      totalRatings: 0,
      averageRating: 0,
      ratingDistribution: []
    };

    // Format rating distribution
    const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    overall.ratingDistribution.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        distribution[rating.toString()]++;
      }
    });

    // Per-driver summary
    const perDriverSummary = await DriverRating.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$driverId',
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: { $push: '$rating' },
          recentRatings: {
            $push: {
              id: '$_id',
              rating: '$rating',
              comment: '$comment',
              parentId: '$parentId',
              studentId: '$studentId',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $sort: { totalRatings: -1 }
      }
    ]);

    // Populate driver and parent/student info for per-driver summary
    const driversWithSummary = await Promise.all(
      perDriverSummary.map(async (summary) => {
        const driver = await Driver.findById(summary._id)
          .select('name email phone photo vehicleNumber')
          .lean();
        
        if (!driver) return null;

        // Format rating distribution for this driver
        const driverDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
        summary.ratingDistribution.forEach(rating => {
          if (rating >= 1 && rating <= 5) {
            driverDistribution[rating.toString()]++;
          }
        });

        // Get recent ratings with parent/student info
        const recentRatings = await Promise.all(
          summary.recentRatings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(async (rating) => {
              const parent = await Parent.findById(rating.parentId)
                .select('name')
                .lean();
              const student = await Student.findById(rating.studentId)
                .select('name')
                .lean();
              
              return {
                id: rating.id.toString(),
                rating: rating.rating,
                comment: rating.comment || '',
                parentName: parent?.name || 'Unknown',
                studentName: student?.name || 'Unknown',
                createdAt: rating.createdAt
              };
            })
        );

        return {
          driverId: summary._id.toString(),
          driverName: driver.name,
          totalRatings: summary.totalRatings,
          averageRating: Math.round(summary.averageRating * 10) / 10,
          ratingDistribution: driverDistribution,
          recentRatings
        };
      })
    );

    const validDrivers = driversWithSummary.filter(d => d !== null);

    res.json({
      success: true,
      message: 'Driver ratings summary retrieved successfully',
      data: {
        totalRatings: overall.totalRatings,
        averageRating: overall.averageRating 
          ? Math.round(overall.averageRating * 10) / 10 
          : 0,
        ratingDistribution: distribution,
        drivers: validDrivers,
        timeRange: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching driver ratings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export driver ratings (must come before parameterized route)
router.get('/drivers/ratings/export', async (req, res) => {
  try {
    const { format = 'csv', driverId, startDate, endDate } = req.query;

    // Build query - filter by manager's school
    const query = {};
    
    // Get all drivers in manager's school
    const schoolDrivers = await Driver.find({ 
      sid: req.user.sid,
      status: { $ne: 'Deleted' }
    }).select('_id');
    const driverIds = schoolDrivers.map(d => d._id);
    
    query.driverId = { $in: driverIds };

    if (driverId) {
      const driver = await Driver.findOne({ 
        _id: driverId, 
        sid: req.user.sid,
        status: { $ne: 'Deleted' }
      });
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }
      query.driverId = driverId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Fetch all ratings (no pagination for export)
    const ratings = await DriverRating.find(query)
      .populate('driverId', 'name vehicleNumber')
      .populate('parentId', 'name')
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Rating ID,Driver Name,Driver ID,Vehicle Number,Parent Name,Student Name,Rating,Comment,Date\n';
      
      const csvRows = ratings.map(rating => {
        const id = rating._id.toString();
        const driverName = rating.driverId?.name || 'Unknown';
        const driverId = rating.driverId?._id.toString() || '';
        const vehicleNumber = rating.driverId?.vehicleNumber || '';
        const parentName = rating.parentId?.name || 'Unknown';
        const studentName = rating.studentId?.name || 'Unknown';
        const ratingValue = rating.rating;
        const comment = (rating.comment || '').replace(/"/g, '""'); // Escape quotes
        const date = new Date(rating.createdAt).toISOString().split('T')[0];
        
        return `"${id}","${driverName}","${driverId}","${vehicleNumber}","${parentName}","${studentName}",${ratingValue},"${comment}","${date}"`;
      });

      const csvContent = csvHeader + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="driver-ratings-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // For Excel format, we'll return CSV for now (can be enhanced with exceljs library later)
      res.status(400).json({
        success: false,
        message: 'Excel format not yet supported. Please use CSV format.',
        error: 'Use format=csv'
      });
    }
  } catch (error) {
    console.error('Error exporting driver ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get ratings for specific driver
router.get('/drivers/:driverId/ratings', async (req, res) => {
  try {
    const { driverId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Verify driver belongs to manager's school
    const driver = await Driver.findOne({ 
      _id: driverId, 
      sid: req.user.sid,
      status: { $ne: 'Deleted' }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
        error: `Driver with ID '${driverId}' does not exist or does not belong to your school`
      });
    }

    // Build query
    const query = { driverId };

    // Build sort
    const sort = {};
    const validSortFields = ['rating', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Count total items
    const totalItems = await DriverRating.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Get driver statistics
    const driverStats = await DriverRating.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const stats = driverStats[0] || {
      totalRatings: 0,
      averageRating: 0
    };

    // Fetch ratings
    const ratings = await DriverRating.find(query)
      .populate('parentId', 'name email')
      .populate('studentId', 'name grade')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format response
    const formattedRatings = ratings.map(rating => ({
      id: rating._id.toString(),
      parent: rating.parentId ? {
        id: rating.parentId._id.toString(),
        name: rating.parentId.name,
        email: rating.parentId.email
      } : null,
      student: rating.studentId ? {
        id: rating.studentId._id.toString(),
        name: rating.studentId.name,
        grade: rating.studentId.grade
      } : null,
      rating: rating.rating,
      comment: rating.comment || '',
      createdAt: rating.createdAt
    }));

    res.json({
      success: true,
      message: 'Driver ratings retrieved successfully',
      data: {
        driver: {
          id: driver._id.toString(),
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          photo: driver.photo,
          vehicleNumber: driver.vehicleNumber,
          totalRatings: stats.totalRatings,
          averageRating: stats.averageRating 
            ? Math.round(stats.averageRating * 10) / 10 
            : 0
        },
        ratings: formattedRatings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching driver ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

