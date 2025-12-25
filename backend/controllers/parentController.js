const Student = require('../models/Student');
const Journey = require('../models/Journey');
const Driver = require('../models/Driver');
const LeaveRequest = require('../models/LeaveRequest');
const Manager = require('../models/Manager');
const { getSocketIO } = require('../services/socketService');
const { emitNotification } = require('../utils/socketHelper');

// Get student travel history
exports.getStudentHistory = async (req, res) => {
  try {
    const parentId = req.user._id;
    const { studentId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    // Verify student belongs to parent
    const student = await Student.findOne({
      _id: studentId,
      parents: parentId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to you'
      });
    }

    // Find all journeys that include this student
    const query = {
      'students.studentId': studentId
    };

    // Optional date filtering
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) {
        query.startedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Include full end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startedAt.$lte = end;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find journeys with pagination
    const journeys = await Journey.find(query)
      .populate('driverId', 'name vehicleNumber')
      .sort({ startedAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit));

    // Build history array from journey student data
    const history = [];

    for (const journey of journeys) {
      const journeyStudent = journey.students.find(
        s => s.studentId.toString() === studentId
      );
      if (journeyStudent) {
        // Add pickup event if exists
        if (journeyStudent.pickedUpAt) {
          history.push({
            id: `${journey._id}_picked`,
            date: journeyStudent.pickedUpAt.toISOString().split('T')[0],
            type: 'picked',
            time: journeyStudent.pickedUpAt.toISOString(),
            journeyId: journey._id.toString(),
            journeyType: journey.journeyType,
            driverName: journey.driverId?.name || 'Unknown Driver',
            vehicleNumber: journey.driverId?.vehicleNumber || 'N/A'
          });
        }

        // Add drop event if exists
        if (journeyStudent.droppedAt) {
          history.push({
            id: `${journey._id}_dropped`,
            date: journeyStudent.droppedAt.toISOString().split('T')[0],
            type: 'dropped',
            time: journeyStudent.droppedAt.toISOString(),
            journeyId: journey._id.toString(),
            journeyType: journey.journeyType,
            driverName: journey.driverId?.name || 'Unknown Driver',
            vehicleNumber: journey.driverId?.vehicleNumber || 'N/A'
          });
        }
      }
    }

    // Also include current student pickup/drop times if not already in history
    if (student.pickup && student.pickup.trim() !== '') {
      try {
        const pickupDateObj = student.pickup instanceof Date ? student.pickup : new Date(student.pickup);
        if (!isNaN(pickupDateObj.getTime())) {
          const pickupDate = pickupDateObj.toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];

          // Only add if it's today's pickup and not already in history
          if (pickupDate === today && !history.some(h => h.type === 'picked' && h.date === pickupDate)) {
            const driver = await Driver.findOne({
              currentRoute: student.route,
              status: 'Active'
            }).select('name vehicleNumber');

            history.unshift({
              id: 'current_picked',
              date: pickupDate,
              type: 'picked',
              time: pickupDateObj.toISOString(),
              journeyId: null,
              journeyType: null,
              driverName: driver?.name || 'Unknown Driver',
              vehicleNumber: driver?.vehicleNumber || 'N/A'
            });
          }
        }
      } catch (err) {
        // Skip invalid pickup date
        console.warn('Invalid pickup date for student:', studentId, err);
      }
    }

    if (student.dropped && student.dropped.trim() !== '') {
      try {
        const dropDateObj = student.dropped instanceof Date ? student.dropped : new Date(student.dropped);
        if (!isNaN(dropDateObj.getTime())) {
          const dropDate = dropDateObj.toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];

          // Only add if it's today's drop and not already in history
          if (dropDate === today && !history.some(h => h.type === 'dropped' && h.date === dropDate)) {
            const driver = await Driver.findOne({
              currentRoute: student.route,
              status: 'Active'
            }).select('name vehicleNumber');

            history.unshift({
              id: 'current_dropped',
              date: dropDate,
              type: 'dropped',
              time: dropDateObj.toISOString(),
              journeyId: null,
              journeyType: null,
              driverName: driver?.name || 'Unknown Driver',
              vehicleNumber: driver?.vehicleNumber || 'N/A'
            });
          }
        }
      } catch (err) {
        // Skip invalid drop date
        console.warn('Invalid dropped date for student:', studentId, err);
      }
    }

    // Sort by time (most recent first)
    history.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Get total count for pagination
    const totalJourneys = await Journey.countDocuments(query);
    const totalEvents = history.length; // Approximate (without pagination)

    res.json({
      success: true,
      message: 'Travel history retrieved successfully',
      data: history,
      pagination: {
        total: totalEvents,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalEvents / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Request student leave
exports.requestStudentLeave = async (req, res) => {
  try {
    const parentId = req.user._id;
    const { studentId } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Verify student belongs to parent
    const student = await Student.findOne({
      _id: studentId,
      parents: parentId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to you'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Check for overlapping leave requests
    const overlappingRequest = await LeaveRequest.findOne({
      studentId: studentId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (overlappingRequest) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending or approved leave request for this date range'
      });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      studentId: studentId,
      parentId: parentId,
      startDate: start,
      endDate: end,
      reason: reason || '',
      status: 'pending'
    });

    await leaveRequest.save();

    // Send notification to manager (optional)
    const manager = await Manager.findOne({
      sid: student.sid,
      status: 'Active'
    });

    if (manager) {
      const io = getSocketIO();
      
      emitNotification(io, `manager:${manager._id}`, {
        type: 'leave_request',
        leaveRequestId: leaveRequest._id,
        studentId: studentId,
        studentName: student.name,
        parentName: req.user.name,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: reason || '',
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        id: leaveRequest._id.toString(),
        studentId: studentId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        reason: leaveRequest.reason,
        status: leaveRequest.status,
        createdAt: leaveRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Request student leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Activate student
exports.activateStudent = async (req, res) => {
  try {
    const parentId = req.user._id;
    const { studentId } = req.params;
    const { effectiveDate } = req.body;

    // Verify student belongs to parent
    const student = await Student.findOne({
      _id: studentId,
      parents: parentId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to you'
      });
    }

    // Check if student is already active
    if (student.status === 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Student is already active'
      });
    }

    // Update student status
    student.status = 'Active';
    student.updatedAt = new Date();
    await student.save();

    // If effectiveDate is provided and in the future, you might want to schedule the activation
    // For now, we'll activate immediately
    const effective = effectiveDate ? new Date(effectiveDate) : new Date();

    res.json({
      success: true,
      message: 'Student activated successfully',
      data: {
        id: student._id.toString(),
        name: student.name,
        status: student.status,
        effectiveDate: effective.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Activate student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get leave requests for parent
exports.getLeaveRequests = async (req, res) => {
  try {
    console.log('[getLeaveRequests] Endpoint called');
    const parentId = req.user._id;
    console.log('[getLeaveRequests] Parent ID:', parentId);
    const { studentId, status, page = 1, limit = 50 } = req.query;

    // Build query - only get leave requests for this parent's students
    const parent = await Parent.findById(parentId).select('students');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    const query = {
      parentId: parentId
    };

    // Filter by student if provided
    if (studentId) {
      // Verify student belongs to parent
      if (!parent.students.includes(studentId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Student does not belong to you.'
        });
      }
      query.studentId = studentId;
    } else {
      // Only show leave requests for parent's students
      query.studentId = { $in: parent.students };
    }

    // Filter by status if provided
    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, approved, rejected'
        });
      }
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find leave requests with pagination
    const leaveRequests = await LeaveRequest.find(query)
      .populate('studentId', 'name grade photo')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LeaveRequest.countDocuments(query);

    // Format the response
    const formattedRequests = leaveRequests.map(req => ({
      id: req._id.toString(),
      studentId: req.studentId._id.toString(),
      studentName: req.studentId.name,
      studentGrade: req.studentId.grade || 'N/A',
      studentPhoto: req.studentId.photo || null,
      startDate: req.startDate.toISOString().split('T')[0],
      endDate: req.endDate.toISOString().split('T')[0],
      reason: req.reason || '',
      status: req.status,
      reviewedBy: req.reviewedBy ? {
        id: req.reviewedBy._id.toString(),
        name: req.reviewedBy.name
      } : null,
      reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
      reviewNotes: req.reviewNotes || null,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString()
    }));

    res.json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: formattedRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

