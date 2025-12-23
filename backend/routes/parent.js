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
const Staff = require('../models/Staff');
const { sendPushNotification, sendToDevice } = require('../services/firebaseService');
const { getSocketIO } = require('../services/socketService');

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
    
    // Process each student to find driver and teacher
    const studentsData = await Promise.all(parent.students.map(async (student) => {
      let driver = null;
      let teacher = null;

      // Find driver: First try to match by route, then fallback to any active driver for school
      if (student.route) {
        // Try to find driver where currentRoute matches student's route
        driver = await Driver.findOne({
          currentRoute: student.route._id,
          sid: student.sid,
          status: 'Active'
        }).select('_id name vehicleNumber');

        // If no driver found via route, fallback to any active driver for the school
        if (!driver) {
          driver = await Driver.findOne({
            sid: student.sid,
            status: 'Active'
          }).select('_id name vehicleNumber');
        }
      } else {
        // If student has no route, try to find any active driver for the school
        driver = await Driver.findOne({
          sid: student.sid,
          status: 'Active'
        }).select('_id name vehicleNumber');
      }

      // Find teacher: Match student's grade with teacher's assigned class
      if (student.grade && student.sid) {
        const studentGrade = (student.grade || '').trim().toLowerCase();
        
        // Find all active teachers for this school
        const teachers = await Staff.find({
          sid: student.sid,
          role: 'teacher',
          status: 'Active',
          isdelete: false
        }).select('_id name assignedClass assignedClasses');

        // Find teacher with matching assignedClass or assignedClasses
        for (const t of teachers) {
          // Check assignedClass (backward compatibility)
          if (t.assignedClass) {
            const teacherClass = (t.assignedClass || '').trim().toLowerCase();
            if (teacherClass === studentGrade) {
              teacher = t;
              break;
            }
          }
          
          // Check assignedClasses array
          if (t.assignedClasses && Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0) {
            const matches = t.assignedClasses.some(cls => {
              const normalizedClass = (cls || '').trim().toLowerCase();
              return normalizedClass === studentGrade;
            });
            if (matches) {
              teacher = t;
              break;
            }
          }
        }
      }

      return {
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
        // Driver info at student level (for mobile app compatibility)
        driverId: driver ? driver._id.toString() : null,
        driverName: driver ? driver.name : null,
        vehicleNumber: driver ? driver.vehicleNumber : null,
        // Teacher info at student level (for mobile app compatibility)
        teacherId: teacher ? teacher._id.toString() : null,
        teacherName: teacher ? teacher.name : null,
        // Route info (kept for backward compatibility)
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
      };
    }));

    res.json({
      message: 'success',
      data: studentsData
    });
  } catch (error) {
    console.error('Error fetching parent students:', error);
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

    const entriesData = diaryEntries.map(entry => {
      // Check if entry is actually signed (has valid signedBy and signedAt)
      // signedBy can be ObjectId or populated object, signedAt must be a valid date
      const hasSignature = entry.parentSignature && 
                           entry.parentSignature.signedBy && 
                           entry.parentSignature.signedAt;
      const isSigned = hasSignature && 
                       (entry.parentSignature.signedAt instanceof Date || 
                        (typeof entry.parentSignature.signedAt === 'string' && entry.parentSignature.signedAt.length > 0));

      return {
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
        // Only return parentSignature if entry is actually signed
        parentSignature: isSigned ? {
          signedBy: {
            id: entry.parentSignature.signedBy._id ? entry.parentSignature.signedBy._id.toString() : entry.parentSignature.signedBy.toString(),
            name: entry.parentSignature.signedBy.name || 'Parent'
          },
          signedAt: entry.parentSignature.signedAt instanceof Date 
            ? entry.parentSignature.signedAt.toISOString() 
            : entry.parentSignature.signedAt,
          signature: entry.parentSignature.signature
        } : null,
        createdAt: entry.createdAt
      };
    });

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
      .populate('teacherId', 'name email photo')
      .populate('parentSignature.signedBy', 'name email');

    if (!entry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }

    // Verify student belongs to parent
    if (!parent.students.includes(entry.studentId._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build full URLs for attachments
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    // Check if entry is actually signed (has valid signedBy and signedAt)
    // Must have both signedBy (ObjectId) and signedAt (Date) to be considered signed
    const isSigned = entry.parentSignature && 
                     entry.parentSignature.signedBy && 
                     entry.parentSignature.signedAt &&
                     (entry.parentSignature.signedAt instanceof Date || 
                      (typeof entry.parentSignature.signedAt === 'string' && entry.parentSignature.signedAt.length > 0));

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
        // Only return parentSignature if entry is actually signed
        parentSignature: isSigned ? {
          signedBy: {
            id: entry.parentSignature.signedBy._id ? entry.parentSignature.signedBy._id.toString() : entry.parentSignature.signedBy.toString(),
            name: entry.parentSignature.signedBy.name || 'Parent'
          },
          signedAt: entry.parentSignature.signedAt instanceof Date 
            ? entry.parentSignature.signedAt.toISOString() 
            : entry.parentSignature.signedAt,
          signature: entry.parentSignature.signature,
          note: entry.parentSignature.note || null
        } : null,
        // Convenience top-level field for parent note so mobile/web apps can read it easily
        parentNote: entry.parentNote || (entry.parentSignature && entry.parentSignature.note) || null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching diary entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sign diary entry
router.post('/diary/:entryId/sign', async (req, res) => {
  try {
    const { entryId } = req.params;
    // Accept parentNote from multiple possible field names (for mobile app compatibility)
    const { signature, parentNote, note, parent_note, noteFromParent } = req.body;
    const parent = await Parent.findById(req.user._id);
    
    // Use the first available note field
    const receivedNote = parentNote || note || parent_note || noteFromParent || null;

    if (!signature || signature.trim() === '') {
      return res.status(400).json({ message: 'Signature is required' });
    }

    const entry = await Diary.findById(entryId)
      .populate('studentId', 'name photo grade')
      .populate('teacherId', 'name email deviceToken');

    if (!entry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }

    // Verify student belongs to parent
    if (!parent.students.includes(entry.studentId._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Normalise/clean parent note (optional)
    const cleanParentNote =
      receivedNote && typeof receivedNote === 'string' && receivedNote.trim().length > 0
        ? receivedNote.trim()
        : null;

    // Debug logging to see what we're receiving
    console.log(`[Parent Sign] Entry ${entryId}:`);
    console.log(`  - Request body keys: ${Object.keys(req.body).join(', ')}`);
    console.log(`  - Received parentNote="${parentNote}", note="${note}", parent_note="${parent_note}", noteFromParent="${noteFromParent}"`);
    console.log(`  - Using receivedNote="${receivedNote}" (type: ${typeof receivedNote})`);
    console.log(`  - Cleaned note="${cleanParentNote}"`);

    // Update diary entry with parent signature
    entry.parentSignature = {
      signedBy: parent._id,
      signedAt: new Date(),
      signature: signature,
      note: cleanParentNote || null // Explicitly set to null if empty
    };

    // Store a copy of the note at root level for easier access in mobile/web apps
    // Always set it (even if null) to ensure consistency
    entry.parentNote = cleanParentNote || null;

    // Mark the nested object as modified to ensure Mongoose saves it
    entry.markModified('parentSignature');
    entry.markModified('parentNote');

    // Make teacher note visible after parent signs
    if (entry.teacherNote) {
      entry.teacherNoteVisible = true;
    }

    // Save and verify
    await entry.save();
    
    // Reload from database to verify it was saved
    const savedEntry = await Diary.findById(entryId);
    console.log(`[Parent Sign] After save - Entry ${entryId}: parentNote="${savedEntry.parentNote}", parentSignature.note="${savedEntry.parentSignature?.note}"`);

    // Notify teacher via Socket.io and FCM
    const io = getSocketIO();
    const notificationMessage = `✅ ${parent.name} has signed the diary entry for ${entry.studentId.name}`;
    const hasTeacherNote = !!entry.teacherNote;

    // Send Socket.io notification
    if (entry.teacherId) {
      io.to(`teacher:${entry.teacherId._id}`).emit('notification', {
        type: 'diary_signed',
        diaryId: entry._id,
        studentId: entry.studentId._id,
        studentName: entry.studentId.name,
        parentName: parent.name,
        message: notificationMessage,
        hasTeacherNote: hasTeacherNote,
        timestamp: new Date().toISOString()
      });

      // Send FCM notification to teacher
      if (entry.teacherId.deviceToken && entry.teacherId.deviceToken.trim() !== '') {
        try {
          await sendToDevice(
            entry.teacherId.deviceToken,
            notificationMessage,
            {
              type: 'diary_signed',
              diaryId: entry._id.toString(),
              studentId: entry.studentId._id.toString(),
              studentName: entry.studentId.name,
              parentName: parent.name,
              hasTeacherNote: hasTeacherNote.toString() // NEW: Indicate if note exists
            },
            '✅ Diary Signed'
          );
        } catch (fcmError) {
          console.error('Error sending FCM notification to teacher:', fcmError);
        }
      }
    }

    res.json({
      message: 'Diary entry signed successfully',
      data: {
        id: entry._id,
        parentSignature: {
          signedBy: {
            id: parent._id,
            name: parent.name
          },
          signedAt: entry.parentSignature.signedAt,
          note: entry.parentSignature.note || null // Include note in response
        },
        parentNote: entry.parentNote || null, // Include root level note in response
        teacherNoteVisible: entry.teacherNoteVisible
      }
    });
  } catch (error) {
    console.error('Error signing diary entry:', error);
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
// IMPORTANT: Route order is critical! Specific routes MUST come before parameterized routes.
// Express matches routes in order, so /messages/:id would match /messages/manager if defined first.

const { sendToManager } = require('../controllers/parentMessageController');
const Manager = require('../models/Manager');

// Specific routes first (must come before parameterized routes)
// Get manager information for parent's school
router.get('/manager', async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }
    
    console.log(`🔍 [GET /manager] Searching for manager with SID: ${parent.sid}`);
    
    // Ensure SID is ObjectId for proper matching
    let parentSid = parent.sid;
    if (parentSid && typeof parentSid === 'string') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(parentSid)) {
        parentSid = new mongoose.Types.ObjectId(parentSid);
      }
    }
    
    // Find manager for parent's school - try Active first, then any non-deleted
    let manager = await Manager.findOne({
      sid: parentSid,
      status: 'Active',
      isDeleted: false
    }).select('_id name email phone photo sid status');
    
    // If no active manager, try any non-deleted manager
    if (!manager) {
      console.log(`⚠️ [GET /manager] No Active manager found, checking for any non-deleted manager...`);
      manager = await Manager.findOne({
        sid: parentSid,
        isDeleted: false
      }).select('_id name email phone photo sid status');
    }
    
    // If still no manager, try any manager (for debugging)
    if (!manager) {
      const anyManager = await Manager.findOne({ sid: parentSid }).select('_id name email phone photo sid status isDeleted');
      if (anyManager) {
        console.log(`⚠️ [GET /manager] Found manager but isDeleted: ${anyManager.isDeleted}, status: ${anyManager.status}`);
        // Return it anyway for debugging purposes
        manager = anyManager;
      }
    }
    
    if (!manager) {
      console.log(`❌ [GET /manager] Manager not found for SID: ${parentSid}`);
      
      // Debug: Check all managers
      const allManagers = await Manager.find({}).select('_id name sid status isDeleted').limit(10);
      console.log(`📊 [GET /manager] Sample managers in system:`, 
        allManagers.map(m => ({
          id: m._id,
          name: m.name,
          sid: m.sid?.toString(),
          status: m.status,
          isDeleted: m.isDeleted
        }))
      );
      
      return res.status(404).json({
        success: false,
        message: 'Manager not found for your school. Please contact administrator to assign a manager to your school.'
      });
    }
    
    // Build full photo URL if photo exists
    let photoUrl = null;
    if (manager.photo) {
      if (manager.photo.startsWith('http://') || manager.photo.startsWith('https://')) {
        photoUrl = manager.photo;
      } else {
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        photoUrl = `${baseUrl}${manager.photo.startsWith('/') ? '' : '/'}${manager.photo}`;
      }
    }
    
    const managerData = {
      id: manager._id.toString(),
      name: manager.name,
      email: manager.email || null,
      phone: manager.phone || null,
      photo: photoUrl,
      sid: manager.sid ? manager.sid.toString() : null,
      status: manager.status
    };
    
    res.status(200).json({
      success: true,
      message: 'Manager information retrieved successfully',
      manager: managerData
    });
  } catch (error) {
    console.error('Error fetching manager information:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
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

// Send message to driver
router.post('/messages/driver', async (req, res) => {
  try {
    const { driverId, studentId, subject, message, attachments } = req.body;
    const parent = await Parent.findById(req.user._id);

    if (!driverId || !message) {
      return res.status(400).json({ message: 'Driver ID and message are required' });
    }

    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Verify student belongs to parent if provided
    if (studentId) {
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied. Student does not belong to you.' });
      }
    }

    // Create message
    const newMessage = new Message({
      from: 'parent',
      fromId: parent._id,
      fromName: parent.name,
      to: 'driver',
      toId: driver._id,
      studentId: studentId || null,
      subject: subject || `Message from ${parent.name}`,
      message,
      type: 'direct',
      attachments: attachments || []
    });

    await newMessage.save();

    // Notify driver via Socket.io and FCM
    const io = getSocketIO();
    const notificationMessage = `💬 New message from ${parent.name}${studentId ? ` about ${(await Student.findById(studentId)).name}` : ''}`;

    // Send Socket.io notification
    io.to(`driver:${driver._id}`).emit('notification', {
      type: 'message',
      messageId: newMessage._id,
      from: parent.name,
      fromType: 'parent',
      subject: newMessage.subject,
      studentId: studentId || null,
      timestamp: new Date().toISOString()
    });

    // Send FCM notification to driver
    if (driver.deviceToken && driver.deviceToken.trim() !== '') {
      try {
        await sendToDevice(
          driver.deviceToken,
          notificationMessage,
          {
            type: 'message',
            messageId: newMessage._id.toString(),
            fromId: parent._id.toString(),
            fromName: parent.name,
            fromType: 'parent',
            subject: newMessage.subject,
            studentId: studentId || null
          },
          '💬 New Message'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification to driver:', fcmError);
      }
    }

    res.status(201).json({
      message: 'Message sent to driver successfully',
      data: {
        id: newMessage._id,
        to: {
          id: driver._id,
          name: driver.name,
          type: 'driver'
        },
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message to driver:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to manager
router.post('/messages/manager', sendToManager);

// Parameterized routes (must come after specific routes)
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

// Parameterized routes (must come after specific routes)
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

// Send message to driver
router.post('/messages/driver', async (req, res) => {
  try {
    const { driverId, studentId, subject, message, attachments } = req.body;
    const parent = await Parent.findById(req.user._id);

    if (!driverId || !message) {
      return res.status(400).json({ message: 'Driver ID and message are required' });
    }

    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Verify student belongs to parent if provided
    if (studentId) {
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied. Student does not belong to you.' });
      }
    }

    // Create message
    const newMessage = new Message({
      from: 'parent',
      fromId: parent._id,
      fromName: parent.name,
      to: 'driver',
      toId: driver._id,
      studentId: studentId || null,
      subject: subject || `Message from ${parent.name}`,
      message,
      type: 'direct',
      attachments: attachments || []
    });

    await newMessage.save();

    // Notify driver via Socket.io and FCM
    const io = getSocketIO();
    const notificationMessage = `💬 New message from ${parent.name}${studentId ? ` about ${(await Student.findById(studentId)).name}` : ''}`;

    // Send Socket.io notification
    io.to(`driver:${driver._id}`).emit('notification', {
      type: 'message',
      messageId: newMessage._id,
      from: parent.name,
      fromType: 'parent',
      subject: newMessage.subject,
      studentId: studentId || null,
      timestamp: new Date().toISOString()
    });

    // Send FCM notification to driver
    if (driver.deviceToken && driver.deviceToken.trim() !== '') {
      try {
        await sendToDevice(
          driver.deviceToken,
          notificationMessage,
          {
            type: 'message',
            messageId: newMessage._id.toString(),
            fromId: parent._id.toString(),
            fromName: parent.name,
            fromType: 'parent',
            subject: newMessage.subject,
            studentId: studentId || null
          },
          '💬 New Message'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification to driver:', fcmError);
      }
    }

    res.status(201).json({
      message: 'Message sent to driver successfully',
      data: {
        id: newMessage._id,
        to: {
          id: driver._id,
          name: driver.name,
          type: 'driver'
        },
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message to driver:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to teacher
router.post('/messages/teacher', async (req, res) => {
  try {
    const { teacherId, studentId, subject, message, attachments } = req.body;
    const parent = await Parent.findById(req.user._id);

    if (!teacherId || !message) {
      return res.status(400).json({ message: 'Teacher ID and message are required' });
    }

    // Verify teacher exists
    const teacher = await Staff.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify student belongs to parent if provided
    if (studentId) {
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied. Student does not belong to you.' });
      }
    }

    // Create message
    const newMessage = new Message({
      from: 'parent',
      fromId: parent._id,
      fromName: parent.name,
      to: 'teacher',
      toId: teacher._id,
      studentId: studentId || null,
      subject: subject || `Message from ${parent.name}`,
      message,
      type: 'direct',
      attachments: attachments || []
    });

    await newMessage.save();

    // Notify teacher via Socket.io and FCM
    const io = getSocketIO();
    const student = studentId ? await Student.findById(studentId) : null;
    const notificationMessage = `💬 New message from ${parent.name}${student ? ` about ${student.name}` : ''}`;

    // Send Socket.io notification
    io.to(`teacher:${teacher._id}`).emit('notification', {
      type: 'message',
      messageId: newMessage._id,
      from: parent.name,
      fromType: 'parent',
      subject: newMessage.subject,
      studentId: studentId || null,
      timestamp: new Date().toISOString()
    });

    // Send FCM notification to teacher
    if (teacher.deviceToken && teacher.deviceToken.trim() !== '') {
      try {
        await sendToDevice(
          teacher.deviceToken,
          notificationMessage,
          {
            type: 'message',
            messageId: newMessage._id.toString(),
            fromId: parent._id.toString(),
            fromName: parent.name,
            fromType: 'parent',
            subject: newMessage.subject,
            studentId: studentId || null
          },
          '💬 New Message'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification to teacher:', fcmError);
      }
    }

    res.status(201).json({
      message: 'Message sent to teacher successfully',
      data: {
        id: newMessage._id,
        to: {
          id: teacher._id,
          name: teacher.name,
          type: 'teacher'
        },
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message to teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Parameterized routes (must come after specific routes)
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

    // Notify recipient via Socket.io and FCM
    const io = getSocketIO();
    let recipient = null;
    let recipientDeviceToken = null;

    if (originalMessage.to === 'driver') {
      recipient = await Driver.findById(originalMessage.toId);
      recipientDeviceToken = recipient?.deviceToken;
    } else if (originalMessage.to === 'teacher') {
      recipient = await Staff.findById(originalMessage.toId);
      recipientDeviceToken = recipient?.deviceToken;
    }

    if (recipient) {
      const notificationMessage = `💬 Reply from ${parent.name}`;

      // Send Socket.io notification
      if (originalMessage.to === 'driver') {
        io.to(`driver:${recipient._id}`).emit('notification', {
          type: 'message',
          messageId: reply._id,
          from: parent.name,
          fromType: 'parent',
          subject: reply.subject,
          timestamp: new Date().toISOString()
        });
      } else if (originalMessage.to === 'teacher') {
        io.to(`teacher:${recipient._id}`).emit('notification', {
          type: 'message',
          messageId: reply._id,
          from: parent.name,
          fromType: 'parent',
          subject: reply.subject,
          timestamp: new Date().toISOString()
        });
      }

      // Send FCM notification
      if (recipientDeviceToken && recipientDeviceToken.trim() !== '') {
        try {
          await sendToDevice(
            recipientDeviceToken,
            notificationMessage,
            {
              type: 'message',
              messageId: reply._id.toString(),
              fromId: parent._id.toString(),
              fromName: parent.name,
              fromType: 'parent',
              subject: reply.subject
            },
            '💬 New Reply'
          );
        } catch (fcmError) {
          console.error('Error sending FCM notification for reply:', fcmError);
        }
      }
    }

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

// General routes last (must come after all specific and parameterized routes)
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
