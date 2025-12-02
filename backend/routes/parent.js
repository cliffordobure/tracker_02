const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Notification = require('../models/Notification');
const Diary = require('../models/Diary');
const Noticeboard = require('../models/Noticeboard');
const Message = require('../models/Message');
const DriverRating = require('../models/DriverRating');

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
    
    // Validate studentId format
    if (!studentId || !studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid student ID format',
        error: 'INVALID_STUDENT_ID'
      });
    }

    const parent = await Parent.findById(req.user._id);
    
    if (!parent) {
      return res.status(404).json({ 
        success: false,
        message: 'Parent not found',
        error: 'PARENT_NOT_FOUND'
      });
    }

    // Verify student belongs to parent
    if (!parent.students || !parent.students.includes(studentId)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. This student does not belong to you.',
        error: 'ACCESS_DENIED'
      });
    }

    const student = await Student.findById(studentId)
      .populate({
        path: 'route',
        populate: {
          path: 'driver',
          select: 'name phone photo latitude longitude vehicleNumber updatedAt status'
        }
      });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    // Check if student has a route assigned
    if (!student.route) {
      return res.json({
        success: true,
        message: 'Student has no route assigned',
        driver: null
      });
    }

    // Check if route has a driver assigned
    if (!student.route.driver) {
      return res.json({
        success: true,
        message: 'Route has no driver assigned',
        driver: null
      });
    }

    const driver = student.route.driver;

    // Check if driver has location data
    if (driver.latitude === null || driver.latitude === undefined || 
        driver.longitude === null || driver.longitude === undefined) {
      return res.json({
        success: true,
        message: 'Driver location not available yet',
        driver: {
          id: driver._id,
          name: driver.name,
          phone: driver.phone,
          photo: driver.photo,
          vehicleNumber: driver.vehicleNumber,
          location: null
        }
      });
    }

    // Return driver location
    res.json({
      success: true,
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
          timestamp: driver.updatedAt || new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching driver location:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching driver location',
      error: error.message 
    });
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

// ==================== DIARY ENDPOINTS ====================

// Get parent's diary entries with pagination and filters
router.get('/diary', async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const { page = 1, limit = 20, studentId, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query - only get diary entries for parent's students
    let query = {
      studentId: { $in: parent.students },
      isdelete: false
    };

    // Filter by student if provided
    if (studentId) {
      // Verify student belongs to parent
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      query.studentId = studentId;
    }

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const diaryEntries = await Diary.find(query)
      .populate('studentId', 'name photo grade')
      .populate('teacherId', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Diary.countDocuments(query);

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const entriesData = diaryEntries.map(entry => ({
      id: entry._id,
      student: {
        id: entry.studentId._id,
        name: entry.studentId.name,
        photo: entry.studentId.photo,
        grade: entry.studentId.grade
      },
      teacher: {
        id: entry.teacherId._id,
        name: entry.teacherName || entry.teacherId.name
      },
      content: entry.content,
      date: entry.date,
      attachments: entry.attachments.map(att => {
        if (att.startsWith('http://') || att.startsWith('https://')) {
          return att;
        }
        return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
      }),
      createdAt: entry.createdAt
    }));

    res.json({
      message: 'success',
      data: entriesData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific diary entry details
router.get('/diary/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const parent = await Parent.findById(req.user._id);

    const entry = await Diary.findById(entryId)
      .populate('studentId', 'name photo grade')
      .populate('teacherId', 'name email photo');

    if (!entry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }

    // Verify student belongs to parent
    if (!parent.students.includes(entry.studentId._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.json({
      message: 'success',
      data: {
        id: entry._id,
        student: {
          id: entry.studentId._id,
          name: entry.studentId.name,
          photo: entry.studentId.photo,
          grade: entry.studentId.grade
        },
        teacher: {
          id: entry.teacherId._id,
          name: entry.teacherName || entry.teacherId.name,
          email: entry.teacherId.email,
          photo: entry.teacherId.photo
        },
        content: entry.content,
        date: entry.date,
        attachments: entry.attachments.map(att => {
          if (att.startsWith('http://') || att.startsWith('https://')) {
            return att;
          }
          return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
        }),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching diary entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== NOTICEBOARD ENDPOINTS ====================

// Get parent's notices with pagination and filters
router.get('/notices', async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const { page = 1, limit = 20, category, schoolId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get parent's students to filter notices
    const students = await Student.find({ _id: { $in: parent.students } });
    const studentIds = students.map(s => s._id);
    const schoolIds = [...new Set(students.map(s => s.sid?.toString() || s.sid).filter(Boolean))];

    // Build query
    let query = {
      isdelete: false,
      $or: [
        { studentId: { $in: studentIds } },
        { sid: { $in: schoolIds } },
        { studentId: null } // General notices for the school
      ]
    };

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by school if provided
    if (schoolId) {
      query.sid = schoolId;
    }

    const notices = await Noticeboard.find(query)
      .populate('studentId', 'name photo')
      .populate('sid', 'name')
      .sort({ priority: 1, createdAt: -1 }) // Sort by priority (urgent first), then date
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Noticeboard.countDocuments(query);

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const noticesData = notices.map(notice => {
      // Check if parent has read this notice
      const isRead = (notice.readBy || []).some(
        read => read.parentId && read.parentId.toString() === req.user._id.toString()
      );

      return {
        id: notice._id,
        title: notice.title,
        message: notice.message,
        category: notice.category || 'general',
        priority: notice.priority || 'normal',
        isRead,
        student: notice.studentId ? {
          id: notice.studentId._id,
          name: notice.studentId.name,
          photo: notice.studentId.photo
        } : null,
        school: notice.sid ? {
          id: notice.sid._id,
          name: notice.sid.name
        } : null,
        attachments: notice.attachments.map(att => {
          if (att.startsWith('http://') || att.startsWith('https://')) {
            return att;
          }
          return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
        }),
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt
      };
    });

    res.json({
      message: 'success',
      data: noticesData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific notice details
router.get('/notices/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const parent = await Parent.findById(req.user._id);

    const notice = await Noticeboard.findById(noticeId)
      .populate('studentId', 'name photo')
      .populate('sid', 'name');

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Verify access - check if notice is for parent's student or school
    if (notice.studentId) {
      if (!parent.students.includes(notice.studentId._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Mark as read if not already read
    if (!notice.readBy) {
      notice.readBy = [];
    }
    const isRead = notice.readBy.some(
      read => read.parentId && read.parentId.toString() === req.user._id.toString()
    );

    if (!isRead) {
      notice.readBy.push({
        parentId: req.user._id,
        readAt: new Date()
      });
      await notice.save();
    }

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.json({
      message: 'success',
      data: {
        id: notice._id,
        title: notice.title,
        message: notice.message,
        category: notice.category || 'general',
        priority: notice.priority || 'normal',
        isRead: true, // Now marked as read
        student: notice.studentId ? {
          id: notice.studentId._id,
          name: notice.studentId.name,
          photo: notice.studentId.photo
        } : null,
        school: notice.sid ? {
          id: notice.sid._id,
          name: notice.sid.name
        } : null,
        attachments: notice.attachments.map(att => {
          if (att.startsWith('http://') || att.startsWith('https://')) {
            return att;
          }
          return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
        }),
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notice as read
router.put('/notices/:noticeId/read', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const parent = await Parent.findById(req.user._id);

    const notice = await Noticeboard.findById(noticeId);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Verify access
    if (notice.studentId) {
      if (!parent.students.includes(notice.studentId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check if already read
    if (!notice.readBy) {
      notice.readBy = [];
    }
    const alreadyRead = notice.readBy.some(
      read => read.parentId && read.parentId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      notice.readBy.push({
        parentId: req.user._id,
        readAt: new Date()
      });
      await notice.save();
    }

    res.json({
      message: 'Notice marked as read',
      data: {
        id: notice._id,
        isRead: true
      }
    });
  } catch (error) {
    console.error('Error marking notice as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== INBOX/MESSAGES ENDPOINTS ====================

// Get parent's messages with pagination and filters
router.get('/messages', async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const { page = 1, limit = 20, type, isRead, studentId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {
      to: 'parent',
      toId: req.user._id,
      isdelete: false
    };

    // Filter by type if provided
    if (type) {
      query.type = type;
    }

    // Filter by read status if provided
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Filter by student if provided
    if (studentId) {
      // Verify student belongs to parent
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      query.studentId = studentId;
    }

    const messages = await Message.find(query)
      .populate('studentId', 'name photo')
      .populate('fromId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Message.countDocuments(query);

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const messagesData = messages.map(msg => ({
      id: msg._id,
      from: {
        id: msg.fromId._id,
        name: msg.fromName || msg.fromId.name,
        type: msg.from
      },
      to: {
        id: msg.toId,
        type: msg.to
      },
      student: msg.studentId ? {
        id: msg.studentId._id,
        name: msg.studentId.name,
        photo: msg.studentId.photo
      } : null,
      subject: msg.subject,
      message: msg.message,
      type: msg.type,
      isRead: msg.isRead,
      attachments: msg.attachments.map(att => {
        if (att.startsWith('http://') || att.startsWith('https://')) {
          return att;
        }
        return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
      }),
      parentMessageId: msg.parentMessageId,
      createdAt: msg.createdAt
    }));

    res.json({
      message: 'success',
      data: messagesData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific message details
router.get('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const parent = await Parent.findById(req.user._id);

    const message = await Message.findById(messageId)
      .populate('studentId', 'name photo grade')
      .populate('fromId', 'name email photo')
      .populate('parentMessageId');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify access
    if (message.toId.toString() !== req.user._id.toString() || message.to !== 'parent') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if not already read
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.json({
      message: 'success',
      data: {
        id: message._id,
        from: {
          id: message.fromId._id,
          name: message.fromName || message.fromId.name,
          email: message.fromId.email,
          photo: message.fromId.photo,
          type: message.from
        },
        to: {
          id: message.toId,
          type: message.to
        },
        student: message.studentId ? {
          id: message.studentId._id,
          name: message.studentId.name,
          photo: message.studentId.photo,
          grade: message.studentId.grade
        } : null,
        subject: message.subject,
        message: message.message,
        type: message.type,
        isRead: true, // Now marked as read
        attachments: message.attachments.map(att => {
          if (att.startsWith('http://') || att.startsWith('https://')) {
            return att;
          }
          return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
        }),
        parentMessage: message.parentMessageId ? {
          id: message.parentMessageId._id,
          subject: message.parentMessageId.subject,
          message: message.parentMessageId.message
        } : null,
        createdAt: message.createdAt,
        readAt: message.readAt
      }
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark message as read
router.put('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const parent = await Parent.findById(req.user._id);

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify access
    if (message.toId.toString() !== req.user._id.toString() || message.to !== 'parent') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({
      message: 'Message marked as read',
      data: {
        id: message._id,
        isRead: true
      }
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all messages as read
router.put('/messages/read-all', async (req, res) => {
  try {
    await Message.updateMany(
      {
        to: 'parent',
        toId: req.user._id,
        isRead: false,
        isdelete: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reply to a message
router.post('/messages/:messageId/reply', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: replyMessage, attachments } = req.body;
    const parent = await Parent.findById(req.user._id);

    if (!replyMessage || replyMessage.trim() === '') {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const originalMessage = await Message.findById(messageId)
      .populate('fromId', 'name');

    if (!originalMessage) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    // Verify access - can only reply to messages sent to this parent
    if (originalMessage.toId.toString() !== req.user._id.toString() || originalMessage.to !== 'parent') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only reply to direct messages
    if (originalMessage.type !== 'direct') {
      return res.status(400).json({ message: 'Cannot reply to this type of message' });
    }

    // Create reply message
    const reply = new Message({
      from: 'parent',
      fromId: req.user._id,
      fromName: parent.name,
      to: originalMessage.from,
      toId: originalMessage.fromId,
      studentId: originalMessage.studentId,
      subject: originalMessage.subject ? `Re: ${originalMessage.subject}` : 'Re: Message',
      message: replyMessage,
      type: 'direct',
      attachments: attachments || [],
      parentMessageId: messageId
    });

    await reply.save();

    res.status(201).json({
      message: 'Reply sent successfully',
      data: {
        id: reply._id,
        from: {
          id: parent._id,
          name: parent.name,
          type: 'parent'
        },
        to: {
          id: originalMessage.fromId._id,
          name: originalMessage.fromId.name,
          type: originalMessage.from
        },
        subject: reply.subject,
        message: reply.message,
        parentMessageId: reply.parentMessageId,
        createdAt: reply.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== DRIVER RATING ENDPOINT ====================

// Rate a driver
router.post('/driver/rate', async (req, res) => {
  try {
    const { driverId, studentId, rating, comment } = req.body;
    const parent = await Parent.findById(req.user._id);

    if (!driverId || !rating) {
      return res.status(400).json({ message: 'Driver ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // If studentId provided, verify student belongs to parent
    if (studentId) {
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check if parent has already rated this driver (update existing rating)
    let driverRating = await DriverRating.findOne({
      driverId,
      parentId: req.user._id
    });

    if (driverRating) {
      // Update existing rating
      driverRating.rating = rating;
      driverRating.comment = comment || driverRating.comment;
      driverRating.studentId = studentId || driverRating.studentId;
      driverRating.updatedAt = new Date();
      await driverRating.save();
    } else {
      // Create new rating
      driverRating = new DriverRating({
        driverId,
        parentId: req.user._id,
        studentId: studentId || null,
        rating,
        comment: comment || null
      });
      await driverRating.save();
    }

    res.status(201).json({
      message: 'Driver rated successfully',
      data: {
        id: driverRating._id,
        driver: {
          id: driver._id,
          name: driver.name
        },
        rating: driverRating.rating,
        comment: driverRating.comment,
        createdAt: driverRating.createdAt,
        updatedAt: driverRating.updatedAt
      }
    });
  } catch (error) {
    console.error('Error rating driver:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
