const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Notification = require('../models/Notification');
const Journey = require('../models/Journey');
const { getSocketIO } = require('../services/socketService');
const { sendPushNotification } = require('../services/firebaseService');
const journeyController = require('../controllers/journeyController');
const driverController = require('../controllers/driverController');

router.use(authenticate);

// Get driver profile
router.get('/profile', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const driver = await Driver.findById(req.user._id).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: driver._id.toString(),
        name: driver.name,
        email: driver.email,
        phone: driver.phone || null,
        photo: driver.photo || null,
        vehicle: driver.vehicleNumber,
        vehicleNumber: driver.vehicleNumber,
        role: 'driver',
        sid: driver.sid ? driver.sid.toString() : null,
        currentRoute: driver.currentRoute ? driver.currentRoute.toString() : null,
        status: driver.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update driver profile
router.put('/profile', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  next();
}, driverController.updateProfile);

// Get driver's current route and students
router.get('/route', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const driver = await Driver.findById(req.user._id).populate('currentRoute');
    
    if (!driver.currentRoute) {
      return res.json({
        message: 'No route assigned',
        route: null,
        students: []
      });
    }

    const route = await Route.findById(driver.currentRoute._id)
      .populate({
        path: 'students',
        select: 'name photo grade address latitude longitude pickup dropped status parents',
        match: { 
          isdelete: false,
          status: { $ne: 'Leave' } // Exclude students on leave
        },
        populate: {
          path: 'parents',
          select: 'name email phone deviceToken'
        }
      })
      .populate({
        path: 'stops',
        select: 'name address latitude longitude order'
      });

    // Filter out students on leave (additional filter in case match didn't work)
    const activeStudents = (route.students || []).filter(student => 
      student && student.status !== 'Leave' && !student.isdelete
    );

    res.json({
      message: 'success',
      route: {
        id: route._id,
        name: route.name,
        stops: route.stops
      },
      students: activeStudents.map(student => ({
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
        parents: student.parents
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver location (real-time)
router.post('/location', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Only drivers can update location.',
      error: 'ACCESS_DENIED'
    });
  }
  next();
}, driverController.updateLocation);

// Start journey/trip
router.post('/journey/start', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  next();
}, journeyController.startJourney);

// Mark student as picked up
router.post('/student/pickup', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  next();
}, driverController.markStudentPickedUp);

// Mark student as dropped
router.post('/student/drop', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  next();
}, driverController.markStudentDropped);

// End journey/trip
router.post('/journey/end', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  next();
}, journeyController.endJourney);

// Get journey status
router.get('/journey/status', (req, res, next) => {
  if (req.userRole !== 'driver') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
  next();
}, journeyController.getJourneyStatus);

// Get driver journey history
router.get('/journey/history', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Driver role required.',
        error: 'ACCESS_DENIED'
      });
    }

    const driverId = req.user._id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { driverId };

    // Add date filters
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.startedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startedAt.$lte = end;
      }
    }

    // Only return completed journeys for history
    query.status = 'completed';

    // Calculate pagination
    const totalItems = await Journey.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Fetch journeys with population
    const journeys = await Journey.find(query)
      .populate({
        path: 'routeId',
        select: 'name stops',
        populate: {
          path: 'stops',
          select: 'name address latitude longitude order'
        }
      })
      .populate({
        path: 'students.studentId',
        select: 'name photo grade',
        match: { isdelete: { $ne: true } }
      })
      .sort({ startedAt: -1 }) // Newest first
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format response
    const formattedJourneys = journeys.map(journey => {
      // Filter out null students (deleted students)
      const validStudents = journey.students.filter(s => s.studentId !== null);

      return {
        id: journey._id.toString(),
        journeyId: journey._id.toString(),
        route: journey.routeId ? {
          id: journey.routeId._id.toString(),
          name: journey.routeId.name,
          stops: journey.routeId.stops || []
        } : null,
        routeName: journey.routeId?.name || 'Unknown Route',
        status: journey.status,
        journeyStatus: journey.status,
        startedAt: journey.startedAt,
        startTime: journey.startedAt,
        endedAt: journey.endedAt,
        endTime: journey.endedAt,
        completedAt: journey.endedAt,
        createdAt: journey.createdAt,
        students: validStudents.map(s => ({
          id: s.studentId?._id?.toString() || s.studentId?.id,
          name: s.studentId?.name,
          studentName: s.studentId?.name,
          pickedUpAt: s.pickedUpAt,
          pickupTime: s.pickedUpAt,
          droppedAt: s.droppedAt,
          dropTime: s.droppedAt
        })),
        studentsCount: validStudents.length,
        totalStudents: validStudents.length
      };
    });

    res.json({
      success: true,
      message: 'Journey history retrieved successfully',
      data: formattedJourneys,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching journey history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== DRIVER MESSAGING ENDPOINTS ====================
// IMPORTANT: Route order is critical! Specific routes MUST come before parameterized routes.
// Express matches routes in order, so /messages/:id would match /messages/inbox if defined first.

const {
  getInbox,
  sendMessage,
  getMessage,
  markAsRead,
  markAllAsRead,
  replyToMessage,
  getOutbox
} = require('../controllers/driverMessageController');

// Route logging middleware for debugging
const logRoute = (method, path, emoji = '📥') => {
  return (req, res, next) => {
    if (method === 'POST') {
      console.log(`📤 ${method} ${path} route hit`);
    } else {
      console.log(`${emoji} ${method} ${path} route hit`);
    }
    next();
  };
};

// Specific routes first (must come before parameterized routes)
router.get('/messages/inbox', logRoute('GET', '/messages/inbox'), getInbox);
router.get('/messages/outbox', logRoute('GET', '/messages/outbox'), getOutbox);
router.put('/messages/read-all', logRoute('PUT', '/messages/read-all'), markAllAsRead);

// Parameterized routes (must come after specific routes)
router.put('/messages/:id/read', logRoute('PUT', '/messages/:id/read'), markAsRead);
router.post('/messages/:id/reply', logRoute('POST', '/messages/:id/reply'), replyToMessage);
router.get('/messages/:id', logRoute('GET', '/messages/:id'), getMessage);

// General routes last (must come after all specific and parameterized routes)
router.get('/messages', logRoute('GET', '/messages'), getInbox); // GET inbox (default)
router.post('/messages', logRoute('POST', '/messages'), sendMessage); // POST send message

module.exports = router;
