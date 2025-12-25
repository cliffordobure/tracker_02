const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const Diary = require('../models/Diary');
const Noticeboard = require('../models/Noticeboard');
const Message = require('../models/Message');
const Parent = require('../models/Parent');
const Notification = require('../models/Notification');
const { getSocketIO } = require('../services/socketService');
const { sendToDevice } = require('../services/firebaseService');
const { getPhotoUrl } = require('../utils/photoHelper');

router.use(authenticate);

// Verify teacher role
const verifyTeacher = (req, res, next) => {
  if (req.userRole !== 'teacher') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Only teachers can access this endpoint.',
      error: 'ACCESS_DENIED'
    });
  }
  next();
};

// ==================== PROFILE ====================

// Get teacher profile
router.get('/profile', verifyTeacher, async (req, res) => {
  try {
    const teacher = await Staff.findById(req.user._id)
      .select('-password')
      .populate('sid', 'name');

    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        message: 'Teacher not found',
        error: 'TEACHER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        photo: getPhotoUrl(teacher.photo),
        role: 'teacher',
        sid: teacher.sid?._id || teacher.sid,
        schoolName: teacher.sid?.name,
        assignedClass: teacher.assignedClass,
        permissions: teacher.permissions
      }
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// ==================== STUDENTS ====================

// Get students in teacher's assigned class
router.get('/students', verifyTeacher, async (req, res) => {
  try {
    const teacher = await Staff.findById(req.user._id);
    
    if (!teacher.assignedClass) {
      return res.json({
        success: true,
        message: 'No class assigned to teacher',
        data: []
      });
    }

    // Normalize assigned class for case-insensitive comparison
    const assignedClass = teacher.assignedClass.trim();
    const normalizedAssignedClass = assignedClass.toLowerCase();

    // Use case-insensitive query to match grade with assignedClass
    // This handles variations like "pp2", "PP2", "Pp2", etc.
    const students = await Student.find({
      sid: teacher.sid,
      isdelete: false,
      $expr: {
        $eq: [
          { $toLower: { $trim: { input: { $ifNull: ["$grade", ""] } } } },
          normalizedAssignedClass
        ]
      }
    })
      .populate('parents', 'name email phone photo')
      .populate('route', 'name')
      .sort({ name: 1 });

    // Log for debugging
    console.log(`👨‍🏫 Teacher ${teacher.name} (assignedClass: "${assignedClass}") - Found ${students.length} students`);
    if (students.length > 0) {
      console.log(`   Students: ${students.map(s => `${s.name} (grade: "${s.grade}")`).join(', ')}`);
    }

    const studentsData = students.map(student => ({
      id: student._id,
      name: student.name,
      photo: student.photo,
      grade: student.grade,
      address: student.address,
      status: student.status,
      leftSchool: student.leftSchool,
      parents: student.parents,
      route: student.route ? {
        id: student.route._id,
        name: student.route.name
      } : null
    }));

    res.json({
      success: true,
      message: 'success',
      data: studentsData
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update student status (Active, Leave, Missing)
router.put('/students/:studentId/status', verifyTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, reason } = req.body; // status: 'Active', 'Leave', 'Missing', reason: optional text
    
    // Validate studentId
    if (!studentId || studentId === 'undefined' || studentId === 'null') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid student ID',
        error: 'INVALID_STUDENT_ID'
      });
    }

    // Validate status
    const validStatuses = ['Active', 'Leave', 'Missing'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        error: 'INVALID_STATUS'
      });
    }

    const teacher = await Staff.findById(req.user._id);

    const student = await Student.findById(studentId)
      .populate('parents', 'name email phone deviceToken')
      .populate('route', 'name');

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    // Verify student is in teacher's class (case-insensitive comparison)
    const studentGrade = (student.grade || '').trim().toLowerCase();
    const teacherClass = (teacher.assignedClass || '').trim().toLowerCase();
    
    if (studentGrade !== teacherClass) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Student is not in your assigned class.',
        error: 'ACCESS_DENIED'
      });
    }

    // Verify student is in teacher's school
    if (student.sid.toString() !== teacher.sid.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Student is not in your school.',
        error: 'ACCESS_DENIED'
      });
    }

    // Update student status
    const oldStatus = student.status;
    student.status = status;
    
    // If status is 'Leave', also update leftSchool timestamp
    if (status === 'Leave') {
      student.leftSchool = new Date().toISOString();
      student.leftSchoolBy = teacher._id;
    } else if (status === 'Active') {
      // Clear leave information when setting back to Active
      student.leftSchool = '';
      student.leftSchoolBy = null;
    }

    // Store reason if provided (you might want to add a reason field to the Student model)
    // For now, we'll log it
    if (reason && reason.trim()) {
      console.log(`[Teacher] Student ${student.name} status changed to ${status}. Reason: ${reason.trim()}`);
    }

    await student.save();

    // Create notification for parents if status changed to Leave or Missing
    const io = getSocketIO();
    let notificationMessage = '';
    let notificationType = '';

    if (status === 'Leave') {
      notificationMessage = reason 
        ? `📋 ${student.name}'s status has been changed to "On Leave". Reason: ${reason}`
        : `📋 ${student.name}'s status has been changed to "On Leave"`;
      notificationType = 'student_on_leave';
    } else if (status === 'Missing') {
      notificationMessage = `⚠️ ${student.name} has been marked as "Missing"`;
      notificationType = 'student_missing';
    } else if (status === 'Active' && oldStatus !== 'Active') {
      notificationMessage = `✅ ${student.name}'s status has been changed back to "Active"`;
      notificationType = 'student_active';
    }

    if (notificationMessage && student.parents && student.parents.length > 0) {
      for (const parent of student.parents) {
        await Notification.create({
          pid: parent._id,
          sid: student.sid,
          message: notificationMessage,
          type: notificationType,
          studentId: student._id
        });

        // Send real-time notification via Socket.io
        io.to(`parent:${parent._id}`).emit('notification', {
          type: notificationType,
          studentId: student._id,
          studentName: student.name,
          message: notificationMessage,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      message: `Student status updated to ${status} successfully`,
      data: {
        id: student._id,
        name: student.name,
        status: student.status,
        leftSchool: student.leftSchool || null,
        leftSchoolBy: student.leftSchoolBy || null
      }
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Keep the old endpoint for backward compatibility (deprecated - use PUT /students/:studentId/status instead)
router.post('/students/:studentId/leave-school', verifyTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Validate studentId
    if (!studentId || studentId === 'undefined' || studentId === 'null') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid student ID',
        error: 'INVALID_STUDENT_ID'
      });
    }

    // Call the new status endpoint logic
    const teacher = await Staff.findById(req.user._id);
    const student = await Student.findById(studentId)
      .populate('parents', 'name email phone deviceToken')
      .populate('route', 'name');

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    // Verify student is in teacher's class
    const studentGrade = (student.grade || '').trim().toLowerCase();
    const teacherClass = (teacher.assignedClass || '').trim().toLowerCase();
    
    if (studentGrade !== teacherClass || student.sid.toString() !== teacher.sid.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    // Update to Leave status
    student.status = 'Leave';
    student.leftSchool = new Date().toISOString();
    student.leftSchoolBy = teacher._id;
    await student.save();

    res.json({
      success: true,
      message: 'Student marked as leaving school successfully',
      data: {
        id: student._id,
        name: student.name,
        status: student.status,
        leftSchool: student.leftSchool
      }
    });
  } catch (error) {
    console.error('Error in legacy leave-school endpoint:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// ==================== DIARY MANAGEMENT ====================

// Get diary entries for teacher's students
router.get('/diary', verifyTeacher, async (req, res) => {
  try {
    const teacher = await Staff.findById(req.user._id);
    const { page = 1, limit = 20, studentId, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get students in teacher's class
    const students = await Student.find({
      sid: teacher.sid,
      grade: teacher.assignedClass,
      isdelete: false
    }).select('_id');

    const studentIds = students.map(s => s._id);

    // Build query
    let query = {
      studentId: { $in: studentIds },
      isdelete: false
    };

    // Filter by student if provided
    if (studentId) {
      if (!studentIds.includes(studentId)) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
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
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Diary.countDocuments(query);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const entriesData = diaryEntries.map(entry => {
      // Get parent note from multiple possible locations
      // Check both root level parentNote and nested parentSignature.note
      const parentNoteFromSignature = entry.parentSignature?.note;
      const parentNoteFromRoot = entry.parentNote;
      const parentNote = parentNoteFromRoot || parentNoteFromSignature || null;

      // Detailed debug logging to see what's in the database
      if (entry.parentSignature && entry.parentSignature.signedBy) {
        console.log(`[Teacher Diary] Entry ${entry._id}:`);
        console.log(`  - entry.parentNote (raw): ${JSON.stringify(entry.parentNote)}`);
        console.log(`  - entry.parentSignature (raw): ${JSON.stringify(entry.parentSignature)}`);
        console.log(`  - entry.parentSignature.note: ${JSON.stringify(entry.parentSignature.note)}`);
        console.log(`  - Final parentNote: ${JSON.stringify(parentNote)}`);
        console.log(`  - Has parentSignature object: ${!!entry.parentSignature}`);
        console.log(`  - parentSignature keys: ${entry.parentSignature ? Object.keys(entry.parentSignature).join(', ') : 'N/A'}`);
      }

      return {
        id: entry._id,
        student: {
          id: entry.studentId._id,
          name: entry.studentId.name,
          photo: entry.studentId.photo,
          grade: entry.studentId.grade
        },
        teacher: {
          id: teacher._id,
          name: entry.teacherName || teacher.name
        },
        content: entry.content,
        date: entry.date,
        attachments: entry.attachments.map(att => {
          if (att.startsWith('http://') || att.startsWith('https://')) {
            return att;
          }
          return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
        }),
        // Only show teacherNote if teacherNoteVisible is true
        teacherNote: entry.teacherNoteVisible ? entry.teacherNote : null,
        teacherNoteVisible: entry.teacherNoteVisible,
        parentSignature: entry.parentSignature ? {
          signedBy: entry.parentSignature.signedBy,
          signedAt: entry.parentSignature.signedAt,
          signature: entry.parentSignature.signature,
          note: entry.parentSignature.note || null
        } : null,
        // Expose parentNote at root level - check both root level and nested location
        parentNote: parentNote,
        // Also include as parent_note for backward compatibility with mobile apps
        parent_note: parentNote,
        createdAt: entry.createdAt
      };
    });

    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Create diary entry (single student or entire class)
router.post('/diary', verifyTeacher, async (req, res) => {
  try {
    const { studentId, studentIds, sendToAll, content, date, attachments, teacherNote } = req.body;
    const teacher = await Staff.findById(req.user._id);

    // Basic validation
    const hasAnyStudent =
      !!studentId ||
      (Array.isArray(studentIds) && studentIds.length > 0) ||
      sendToAll === true;

    if (!hasAnyStudent || !content) {
      return res.status(400).json({
        success: false,
        message: 'Content and at least one target student are required',
        error: 'MISSING_FIELDS'
      });
    }

    // Validate teacherNote length if provided
    if (teacherNote && teacherNote.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Teacher note must be less than 500 characters',
        error: 'VALIDATION_ERROR'
      });
    }

    // Determine target students
    let targetStudentQuery;

    if (sendToAll === true || studentId === 'ALL' || studentId === 'all') {
      // All students in teacher's class
      targetStudentQuery = {
        sid: teacher.sid,
        grade: teacher.assignedClass,
        isdelete: false
      };
    } else {
      // Specific student(s)
      const targetIds = Array.isArray(studentIds) && studentIds.length > 0
        ? studentIds
        : [studentId];

      targetStudentQuery = {
        _id: { $in: targetIds },
        sid: teacher.sid,
        grade: teacher.assignedClass,
        isdelete: false
      };
    }

    const students = await Student.find(targetStudentQuery).populate('parents');

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid students found in your class for this diary',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    const io = getSocketIO();
    const createdEntries = [];
    const entryDate = date ? new Date(date) : new Date();

    for (const student of students) {
      const diaryEntry = new Diary({
        studentId: student._id,
        teacherId: teacher._id,
        teacherName: teacher.name,
        content,
        date: entryDate,
        attachments: attachments || [],
        teacherNote: teacherNote || null,
        teacherNoteVisible: false // Always false initially
      });

      await diaryEntry.save();

      // Notify parents for this student
      if (student.parents && student.parents.length > 0) {
        for (const parentId of student.parents) {
          await Notification.create({
            pid: parentId,
            sid: student.sid,
            message: `📔 New diary entry for ${student.name}`,
            type: 'general',
            studentId: student._id
          });

          io.to(`parent:${parentId}`).emit('notification', {
            type: 'diary_entry',
            studentId: student._id,
            studentName: student.name,
            message: `New diary entry for ${student.name}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      createdEntries.push({
        id: diaryEntry._id,
        student: {
          id: student._id,
          name: student.name
        },
        content: diaryEntry.content,
        date: diaryEntry.date,
        attachments: diaryEntry.attachments,
        teacherNote: diaryEntry.teacherNote,
        teacherNoteVisible: diaryEntry.teacherNoteVisible,
        createdAt: diaryEntry.createdAt
      });
    }

    // Notify teacher that diary has been sent
    const teacherNotificationMessage =
      createdEntries.length > 1
        ? `📔 Diary sent for ${createdEntries.length} students in your class`
        : `📔 Diary sent for ${createdEntries[0].student.name}`;

    io.to(`teacher:${teacher._id}`).emit('notification', {
      type: 'diary_sent',
      teacherId: teacher._id,
      entriesCount: createdEntries.length,
      entries: createdEntries.map(entry => ({
        id: entry.id,
        studentId: entry.student.id,
        studentName: entry.student.name,
        date: entry.date
      })),
      message: teacherNotificationMessage,
      timestamp: new Date().toISOString()
    });

    // Optional: push notification to teacher's device
    if (teacher.deviceToken && teacher.deviceToken.trim() !== '') {
      try {
        await sendToDevice(
          teacher.deviceToken,
          teacherNotificationMessage,
          {
            type: 'diary_sent',
            entriesCount: createdEntries.length
          },
          '📔 Diary Sent'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification to teacher for diary:', fcmError);
      }
    }

    res.status(201).json({
      success: true,
      message:
        createdEntries.length > 1
          ? 'Diary entries created successfully'
          : 'Diary entry created successfully',
      data: {
        count: createdEntries.length,
        entries: createdEntries
      }
    });
  } catch (error) {
    console.error('Error creating diary entry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update diary entry
router.put('/diary/:entryId', verifyTeacher, async (req, res) => {
  try {
    const { entryId } = req.params;
    const { content, date, attachments, teacherNote } = req.body;
    const teacher = await Staff.findById(req.user._id);

    const entry = await Diary.findById(entryId);
    if (!entry) {
      return res.status(404).json({ 
        success: false,
        message: 'Diary entry not found',
        error: 'ENTRY_NOT_FOUND'
      });
    }

    // Verify entry belongs to teacher
    if (entry.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    // Validate teacherNote length if provided
    if (teacherNote !== undefined) {
      if (teacherNote && teacherNote.length > 500) {
        return res.status(400).json({ 
          success: false,
          message: 'Teacher note must be less than 500 characters',
          error: 'VALIDATION_ERROR'
        });
      }
      entry.teacherNote = teacherNote || null;
    }

    if (content) entry.content = content;
    if (date) entry.date = new Date(date);
    if (attachments) entry.attachments = attachments;
    entry.updatedAt = Date.now();

    await entry.save();

    res.json({
      success: true,
      message: 'Diary entry updated successfully',
      data: {
        id: entry._id,
        content: entry.content,
        date: entry.date,
        attachments: entry.attachments,
        teacherNote: entry.teacherNoteVisible ? entry.teacherNote : null,
        teacherNoteVisible: entry.teacherNoteVisible,
        updatedAt: entry.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating diary entry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Delete diary entry
router.delete('/diary/:entryId', verifyTeacher, async (req, res) => {
  try {
    const { entryId } = req.params;
    const teacher = await Staff.findById(req.user._id);

    const entry = await Diary.findById(entryId);
    if (!entry) {
      return res.status(404).json({ 
        success: false,
        message: 'Diary entry not found',
        error: 'ENTRY_NOT_FOUND'
      });
    }

    // Verify entry belongs to teacher
    if (entry.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    entry.isdelete = true;
    await entry.save();

    res.json({
      success: true,
      message: 'Diary entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// ==================== NOTICEBOARD MANAGEMENT ====================

// Get notices for teacher's school
router.get('/notices', verifyTeacher, async (req, res) => {
  try {
    const teacher = await Staff.findById(req.user._id);
    const { page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get students in teacher's class
    const students = await Student.find({
      sid: teacher.sid,
      grade: teacher.assignedClass,
      isdelete: false
    }).select('_id');

    const studentIds = students.map(s => s._id);

    // Build query
    let query = {
      sid: teacher.sid,
      isdelete: false,
      $or: [
        { studentId: { $in: studentIds } },
        { studentId: null } // General notices
      ]
    };

    if (category) {
      query.category = category;
    }

    const notices = await Noticeboard.find(query)
      .populate('studentId', 'name photo')
      .sort({ priority: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Noticeboard.countDocuments(query);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const noticesData = notices.map(notice => ({
      id: notice._id,
      title: notice.title,
      message: notice.message,
      category: notice.category || 'general',
      priority: notice.priority || 'normal',
      student: notice.studentId ? {
        id: notice.studentId._id,
        name: notice.studentId.name,
        photo: notice.studentId.photo
      } : null,
      attachments: notice.attachments.map(att => {
        if (att.startsWith('http://') || att.startsWith('https://')) {
          return att;
        }
        return `${baseUrl}${att.startsWith('/') ? '' : '/'}${att}`;
      }),
      createdAt: notice.createdAt
    }));

    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Create notice
router.post('/notices', verifyTeacher, async (req, res) => {
  try {
    const { title, message, category, priority, studentId, attachments } = req.body;
    const teacher = await Staff.findById(req.user._id);

    if (!title || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and message are required',
        error: 'MISSING_FIELDS'
      });
    }

    // Verify student if provided (case-insensitive grade comparison)
    if (studentId) {
      const student = await Student.findById(studentId);
      const studentGrade = (student?.grade || '').trim().toLowerCase();
      const teacherClass = (teacher.assignedClass || '').trim().toLowerCase();
      
      if (!student || studentGrade !== teacherClass || student.sid.toString() !== teacher.sid.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }
    }

    const notice = new Noticeboard({
      sid: teacher.sid,
      studentId: studentId || null,
      title,
      message,
      category: category || 'general',
      priority: priority || 'normal',
      attachments: attachments || []
    });

    await notice.save();

    // Notify parents
    const io = getSocketIO();
    if (studentId) {
      const student = await Student.findById(studentId).populate('parents');
      if (student.parents && student.parents.length > 0) {
        for (const parent of student.parents) {
          await Notification.create({
            pid: parent._id,
            sid: teacher.sid,
            message: `📢 New notice: ${title}`,
            type: 'notice',
            studentId: student._id
          });

          io.to(`parent:${parent._id}`).emit('notification', {
            type: 'notice',
            noticeId: notice._id,
            title,
            message,
            timestamp: new Date().toISOString()
          });
        }
      }
    } else {
      // General notice - notify all parents in school
      const students = await Student.find({ sid: teacher.sid, isdelete: false }).populate('parents');
      const parentIds = new Set();
      students.forEach(s => {
        if (s.parents) {
          s.parents.forEach(p => parentIds.add(p._id));
        }
      });

      for (const parentId of parentIds) {
        await Notification.create({
          pid: parentId,
          sid: teacher.sid,
          message: `📢 New notice: ${title}`,
          type: 'notice'
        });

        io.to(`parent:${parentId}`).emit('notification', {
          type: 'notice',
          noticeId: notice._id,
          title,
          message,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: {
        id: notice._id,
        title: notice.title,
        message: notice.message,
        category: notice.category,
        priority: notice.priority,
        createdAt: notice.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update notice
router.put('/notices/:noticeId', verifyTeacher, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { title, message, category, priority, attachments } = req.body;
    const teacher = await Staff.findById(req.user._id);

    const notice = await Noticeboard.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ 
        success: false,
        message: 'Notice not found',
        error: 'NOTICE_NOT_FOUND'
      });
    }

    // Verify notice belongs to teacher's school
    if (notice.sid.toString() !== teacher.sid.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    if (title) notice.title = title;
    if (message) notice.message = message;
    if (category) notice.category = category;
    if (priority) notice.priority = priority;
    if (attachments) notice.attachments = attachments;
    notice.updatedAt = Date.now();

    await notice.save();

    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: {
        id: notice._id,
        title: notice.title,
        message: notice.message,
        category: notice.category,
        priority: notice.priority,
        updatedAt: notice.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Delete notice
router.delete('/notices/:noticeId', verifyTeacher, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const teacher = await Staff.findById(req.user._id);

    const notice = await Noticeboard.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ 
        success: false,
        message: 'Notice not found',
        error: 'NOTICE_NOT_FOUND'
      });
    }

    // Verify notice belongs to teacher's school
    if (notice.sid.toString() !== teacher.sid.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    notice.isdelete = true;
    await notice.save();

    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// ==================== MESSAGING PARENTS ====================

// Get messages (sent and received)
router.get('/messages', verifyTeacher, async (req, res) => {
  try {
    const teacher = await Staff.findById(req.user._id);
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      $or: [
        { from: 'teacher', fromId: teacher._id },
        { to: 'teacher', toId: teacher._id }
      ],
      isdelete: false
    };

    if (type === 'sent') {
      query = { from: 'teacher', fromId: teacher._id, isdelete: false };
    } else if (type === 'received') {
      query = { to: 'teacher', toId: teacher._id, isdelete: false };
    }

    const messages = await Message.find(query)
      .populate('studentId', 'name photo')
      .populate('fromId', 'name photo')
      .populate('toId', 'name photo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Message.countDocuments(query);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const messagesData = messages.map(msg => ({
      id: msg._id,
      from: {
        id: msg.fromId._id,
        name: msg.fromName || msg.fromId.name,
        photo: msg.fromId.photo,
        type: msg.from
      },
      to: {
        id: msg.toId._id,
        name: msg.toId.name,
        photo: msg.toId.photo,
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
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Send message to parent
router.post('/messages', verifyTeacher, async (req, res) => {
  try {
    const { toId, studentId, subject, message, attachments } = req.body;
    const teacher = await Staff.findById(req.user._id);

    if (!toId || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Parent ID and message are required',
        error: 'MISSING_FIELDS'
      });
    }

    // Verify parent exists
    const parent = await Parent.findById(toId);
    if (!parent) {
      return res.status(404).json({ 
        success: false,
        message: 'Parent not found',
        error: 'PARENT_NOT_FOUND'
      });
    }

    // Verify student if provided (case-insensitive grade comparison)
    if (studentId) {
      const student = await Student.findById(studentId);
      const studentGrade = (student?.grade || '').trim().toLowerCase();
      const teacherClass = (teacher.assignedClass || '').trim().toLowerCase();
      
      if (!student || studentGrade !== teacherClass || student.sid.toString() !== teacher.sid.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }
    }

    const newMessage = new Message({
      from: 'teacher',
      fromId: teacher._id,
      fromName: teacher.name,
      to: 'parent',
      toId: parent._id,
      studentId: studentId || null,
      subject: subject || `Message from ${teacher.name}`,
      message,
      type: 'direct',
      attachments: attachments || []
    });

    await newMessage.save();

    // Notify parent
    const io = getSocketIO();
    await Notification.create({
      pid: parent._id,
      sid: teacher.sid,
      message: `💬 New message from ${teacher.name}`,
      type: 'general',
      studentId: studentId || null
    });

    io.to(`parent:${parent._id}`).emit('notification', {
      type: 'message',
      messageId: newMessage._id,
      from: teacher.name,
      subject: newMessage.subject,
      timestamp: new Date().toISOString()
    });

    // Send FCM notification to parent
    if (parent.deviceToken && parent.deviceToken.trim() !== '') {
      try {
        const student = studentId ? await Student.findById(studentId) : null;
        const notificationMessage = `💬 New message from ${teacher.name}${student ? ` about ${student.name}` : ''}`;
        
        await sendToDevice(
          parent.deviceToken,
          notificationMessage,
          {
            type: 'message',
            messageId: newMessage._id.toString(),
            fromId: teacher._id.toString(),
            fromName: teacher.name,
            fromType: 'teacher',
            subject: newMessage.subject,
            studentId: studentId || null
          },
          '💬 New Message'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification to parent:', fcmError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: newMessage._id,
        to: {
          id: parent._id,
          name: parent.name
        },
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Reply to message
router.post('/messages/:messageId/reply', verifyTeacher, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: replyMessage, attachments } = req.body;
    const teacher = await Staff.findById(req.user._id);

    if (!replyMessage || replyMessage.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Reply message is required',
        error: 'MISSING_MESSAGE'
      });
    }

    const originalMessage = await Message.findById(messageId)
      .populate('fromId', 'name');

    if (!originalMessage) {
      return res.status(404).json({ 
        success: false,
        message: 'Original message not found',
        error: 'MESSAGE_NOT_FOUND'
      });
    }

    // Verify access
    if (originalMessage.toId.toString() !== teacher._id.toString() || originalMessage.to !== 'teacher') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    const reply = new Message({
      from: 'teacher',
      fromId: teacher._id,
      fromName: teacher.name,
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

    // Notify parent
    const io = getSocketIO();
    const parent = await Parent.findById(originalMessage.fromId._id);
    
    io.to(`parent:${originalMessage.fromId._id}`).emit('notification', {
      type: 'message',
      messageId: reply._id,
      from: teacher.name,
      subject: reply.subject,
      timestamp: new Date().toISOString()
    });

    // Send FCM notification to parent
    if (parent && parent.deviceToken && parent.deviceToken.trim() !== '') {
      try {
        const notificationMessage = `💬 Reply from ${teacher.name}`;
        
        await sendToDevice(
          parent.deviceToken,
          notificationMessage,
          {
            type: 'message',
            messageId: reply._id.toString(),
            fromId: teacher._id.toString(),
            fromName: teacher.name,
            fromType: 'teacher',
            subject: reply.subject
          },
          '💬 New Reply'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification to parent:', fcmError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        id: reply._id,
        subject: reply.subject,
        message: reply.message,
        parentMessageId: reply.parentMessageId,
        createdAt: reply.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;



