const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Notification = require('../models/Notification');

router.use(authenticate);

// Get parent profile
router.get('/profile', async (req, res) => {
  try {
    // User ID is extracted from JWT token in authenticate middleware
    const parentId = req.user._id;

    // Query database for parent
    const parent = await Parent.findById(parentId).select('_id name email phone photo sid status');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent profile not found',
        error: 'User not found'
      });
    }

    // Check if parent is active (default to 'Active' if status is null/undefined)
    if (parent.status && parent.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Parent account is suspended',
        error: 'Account suspended'
      });
    }

    // Build full photo URL if photo exists
    let photoUrl = null;
    if (parent.photo) {
      // Check if it's already a full URL
      if (parent.photo.startsWith('http://') || parent.photo.startsWith('https://')) {
        photoUrl = parent.photo;
      } else {
        // Construct full URL from request or use environment variable
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        photoUrl = `${baseUrl}${parent.photo.startsWith('/') ? '' : '/'}${parent.photo}`;
      }
    }

    // Return profile in specified format (support both 'user' and 'parent_user' for backward compatibility)
    const profileData = {
      id: parent._id.toString(),
      name: parent.name,
      email: parent.email || null,
      phone: parent.phone || null,
      photo: photoUrl,
      role: 'parent',
      sid: parent.sid ? parent.sid.toString() : null
    };

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      user: profileData,
      // Also include parent_user for backward compatibility
      parent_user: profileData
    });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get parent's students with route and driver info
router.get('/students', async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id).populate({
      path: 'students',
      populate: [
        {
          path: 'route',
          populate: {
            path: 'driver',
            select: 'name phone photo latitude longitude vehicleNumber'
          }
        },
        {
          path: 'route',
          populate: {
            path: 'stops',
            select: 'name address latitude longitude order'
          }
        }
      ]
    });
    
    const studentsData = parent.students.map(student => ({
      id: student._id,
      name: student.name,
      photo: student.photo,
      grade: student.grade,
      address: student.address,
      latitude: student.latitude,
      longitude: student.longitude,
      pickup: student.pickup,
      dropped: student.dropped,
      status: student.status,
      route: student.route ? {
        id: student.route._id,
        name: student.route.name,
        driver: student.route.driver ? {
          id: student.route.driver._id,
          name: student.route.driver.name,
          phone: student.route.driver.phone,
          photo: student.route.driver.photo,
          vehicleNumber: student.route.driver.vehicleNumber,
          location: {
            latitude: student.route.driver.latitude,
            longitude: student.route.driver.longitude
          }
        } : null,
        stops: student.route.stops || []
      } : null
    }));

    res.json({
      message: 'success',
      data: studentsData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's real-time location and status
router.get('/students/:studentId/status', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const parent = await Parent.findById(req.user._id);
    if (!parent.students.includes(studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId)
      .populate({
        path: 'route',
        populate: {
          path: 'driver',
          select: 'name phone photo latitude longitude vehicleNumber'
        }
      })
      .populate({
        path: 'route',
        populate: {
          path: 'stops',
          select: 'name address latitude longitude order'
        }
      });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'success',
      student: {
        id: student._id,
        name: student.name,
        photo: student.photo,
        grade: student.grade,
        address: student.address,
        latitude: student.latitude,
        longitude: student.longitude,
        pickup: student.pickup,
        dropped: student.dropped,
        status: student.status,
        route: student.route ? {
          id: student.route._id,
          name: student.route.name,
          driver: student.route.driver ? {
            id: student.route.driver._id,
            name: student.route.driver.name,
            phone: student.route.driver.phone,
            photo: student.route.driver.photo,
            vehicleNumber: student.route.driver.vehicleNumber,
            location: {
              latitude: student.route.driver.latitude,
              longitude: student.route.driver.longitude,
              timestamp: student.route.driver.updatedAt
            }
          } : null,
          stops: student.route.stops || []
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get parent's notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find({ pid: req.user._id })
      .populate('studentId', 'name photo')
      .populate('routeId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Notification.countDocuments({ pid: req.user._id });

    res.json({
      message: 'success',
      data: notifications.map(notif => ({
        id: notif._id,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead || false,
        student: notif.studentId ? {
          id: notif.studentId._id,
          name: notif.studentId.name,
          photo: notif.studentId.photo
        } : null,
        route: notif.routeId ? {
          id: notif.routeId._id,
          name: notif.routeId.name
        } : null,
        createdAt: notif.createdAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.pid.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        isRead: notification.isRead
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { pid: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get driver location for a student's route (real-time via Socket.io)
router.get('/students/:studentId/driver-location', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const parent = await Parent.findById(req.user._id);
    if (!parent.students.includes(studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId)
      .populate({
        path: 'route',
        populate: {
          path: 'driver',
          select: 'name phone photo latitude longitude vehicleNumber updatedAt'
        }
      });

    if (!student || !student.route || !student.route.driver) {
      return res.json({
        message: 'success',
        driver: null
      });
    }

    const driver = student.route.driver;
    res.json({
      message: 'success',
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        photo: driver.photo,
        vehicleNumber: driver.vehicleNumber,
        location: {
          latitude: driver.latitude,
          longitude: driver.longitude,
          timestamp: driver.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update parent profile
router.put('/profile', async (req, res) => {
  try {
    const { name, email, photo, phone, deviceToken } = req.body;
    const parent = await Parent.findById(req.user._id);

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    if (name) parent.name = name;
    if (email && email !== parent.email) {
      const existingParent = await Parent.findOne({ email });
      if (existingParent) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      parent.email = email;
    }
    if (photo) parent.photo = photo;
    if (phone !== undefined) parent.phone = phone;
    if (deviceToken) parent.deviceToken = deviceToken;
    parent.updatedAt = Date.now();

    await parent.save();
    const parentData = parent.toObject();
    delete parentData.password;

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: parentData._id,
        name: parentData.name,
        email: parentData.email,
        photo: parentData.photo,
        phone: parentData.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Legacy endpoint for backward compatibility
router.get('/students/locations', async (req, res) => {
  const response = await router.handle(req, res);
  if (!response) {
    // If not handled, fallback to old format
    const parent = await Parent.findById(req.user._id).populate('students');
    
    const studentsWithLocations = parent.students.map(student => ({
      id: student._id,
      name: student.name,
      latitude: student.latitude,
      longitude: student.longitude
    }));

    return res.json({
      message: 'success',
      data: studentsWithLocations
    });
  }
});

module.exports = router;
