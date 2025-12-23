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
router.put('/profile', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const driverId = req.user._id;
    const { name, email, phone, photo, deviceToken } = req.body;

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== driver.email) {
      const existingDriver = await Driver.findOne({ email });
      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      driver.email = email;
    }

    if (name) driver.name = name;
    if (phone !== undefined) driver.phone = phone;
    if (photo) driver.photo = photo;
    if (deviceToken) driver.deviceToken = deviceToken;
    driver.updatedAt = new Date();

    await driver.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
        populate: {
          path: 'parents',
          select: 'name email phone deviceToken'
        }
      })
      .populate({
        path: 'stops',
        select: 'name address latitude longitude order'
      });

    res.json({
      message: 'success',
      route: {
        id: route._id,
        name: route.name,
        stops: route.stops
      },
      students: route.students.map(student => ({
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
router.post('/location', async (req, res) => {
  try {
    // Check authentication - must be a driver
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only drivers can update location.',
        error: 'ACCESS_DENIED'
      });
    }

    const { latitude, longitude, timestamp } = req.body; // Accept timestamp from mobile phone

    // Validate required fields
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Latitude and longitude are required',
        error: 'MISSING_COORDINATES'
      });
    }

    // Validate coordinate ranges
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid coordinates. Latitude and longitude must be numbers.',
        error: 'INVALID_COORDINATES'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        success: false,
        message: 'Coordinates out of valid range. Latitude must be -90 to 90, longitude -180 to 180.',
        error: 'INVALID_COORDINATES'
      });
    }

    // Use mobile phone time if provided, otherwise use server time (fallback)
    let updateTime;
    if (timestamp) {
      updateTime = new Date(timestamp);
      // Validate the date
      if (isNaN(updateTime.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid timestamp format. Please provide a valid ISO 8601 timestamp.',
          error: 'INVALID_TIMESTAMP'
        });
      }
    } else {
      updateTime = new Date();
    }

    // Get driver with route info
    const driver = await Driver.findById(req.user._id).populate('currentRoute');

    if (!driver) {
      return res.status(404).json({ 
        success: false,
        message: 'Driver not found',
        error: 'DRIVER_NOT_FOUND'
      });
    }

    // Check driver status
    if (driver.status && driver.status !== 'Active') {
      return res.status(403).json({ 
        success: false,
        message: 'Driver account is suspended. Cannot update location.',
        error: 'ACCOUNT_SUSPENDED'
      });
    }

    // Calculate speed if we have previous location
    let speed = 0;
    if (driver.previousLatitude && driver.previousLongitude && driver.lastLocationUpdate) {
      const timeDiffSeconds = (updateTime - driver.lastLocationUpdate) / 1000; // seconds
      if (timeDiffSeconds > 0) {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (lat - driver.previousLatitude) * Math.PI / 180;
        const dLon = (lng - driver.previousLongitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(driver.previousLatitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // distance in km
        
        // Speed in km/h
        speed = (distance / timeDiffSeconds) * 3600;
        // Cap at reasonable maximum (e.g., 120 km/h)
        speed = Math.min(speed, 120);
      }
    }
    
    // Update driver location
    driver.previousLatitude = driver.latitude;
    driver.previousLongitude = driver.longitude;
    driver.latitude = lat;
    driver.longitude = lng;
    driver.speed = speed;
    driver.lastLocationUpdate = updateTime;
    driver.updatedAt = updateTime;
    await driver.save();

    // Emit location update via socket.io to route-specific room
    const io = getSocketIO();
    const locationData = {
      driverId: driver._id.toString(),
      driverName: driver.name,
      latitude: lat,
      longitude: lng,
      routeId: driver.currentRoute?._id?.toString(),
      routeName: driver.currentRoute?.name,
      vehicleNumber: driver.vehicleNumber,
      speed: driver.speed || 0,
      timestamp: driver.lastLocationUpdate.toISOString()
    };

    // Broadcast to route room for parents tracking this route
    if (driver.currentRoute) {
      io.to(`route:${driver.currentRoute._id}`).emit('driver-location-update', locationData);
      // Also emit to driver room
      io.to(`driver:${driver._id}`).emit('location-update', locationData);
    }
    
    // Also broadcast globally for admin/manager tracking
    io.emit('location-update', locationData);
    // Also broadcast to managers room
    io.to('managers').emit('location-update', locationData);
    io.to('managers').emit('driver-location-update', locationData);

    res.json({ 
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude: driver.latitude,
        longitude: driver.longitude,
        speed: driver.speed,
        timestamp: driver.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating location',
      error: error.message 
    });
  }
});

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
router.post('/student/pickup', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const driverId = req.user._id;
    const { studentId, pickedAt } = req.body; // Accept timestamp from mobile phone

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Check if there's an active journey
    const activeJourney = await Journey.findOne({
      driverId: driverId,
      status: 'in_progress'
    });

    if (!activeJourney) {
      return res.status(400).json({ 
        success: false,
        message: 'No active journey. Please start a journey first.' 
      });
    }

    const driver = await Driver.findById(driverId).populate('currentRoute');
    
    // Verify student is on driver's route
    if (!driver.currentRoute) {
      return res.status(400).json({ 
        success: false,
        message: 'No route assigned to driver' 
      });
    }

    const route = await Route.findById(driver.currentRoute._id);
    if (!route.students.includes(studentId)) {
      return res.status(403).json({ 
        success: false,
        message: 'Student is not on your route' 
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Use mobile phone time if provided, otherwise use server time (fallback)
    let pickupTime;
    if (pickedAt) {
      pickupTime = new Date(pickedAt);
      // Validate the date
      if (isNaN(pickupTime.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid timestamp format. Please provide a valid ISO 8601 timestamp.' 
        });
      }
    } else {
      pickupTime = new Date();
    }
    // Update student pickup time
    student.pickup = pickupTime.toISOString();
    student.status = 'Active';
    student.updatedAt = pickupTime;
    await student.save();
    
    // Populate parents for notifications
    await student.populate('parents');

    // Update journey student status
    const journeyStudent = activeJourney.students.find(
      s => s.studentId.toString() === studentId
    );
    if (journeyStudent) {
      journeyStudent.pickedUpAt = pickupTime;
      journeyStudent.status = 'picked_up';
      activeJourney.updatedAt = pickupTime;
      await activeJourney.save();
    }

    // Create notifications for parents
    const io = getSocketIO();
    const pickupTimeString = pickupTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const message = `✅ ${student.name} has been picked up by the bus at ${pickupTimeString}`;

    if (student.parents && student.parents.length > 0) {
      const parentDeviceTokens = [];
      
      for (const parent of student.parents) {
        await Notification.create({
          pid: parent._id,
          sid: route.sid,
          message,
          type: 'student_picked_up',
          studentId: student._id
        });

        // Send real-time notification via Socket.io
        io.to(`parent:${parent._id}`).emit('notification', {
          type: 'student_picked_up',
          studentId: student._id,
          studentName: student.name,
          message,
          pickupTime: pickupTime.toISOString(),
          pickupTimeLocal: pickupTimeString,
          timestamp: new Date().toISOString()
        });

        // Collect device tokens for FCM
        if (parent.deviceToken && parent.deviceToken.trim() !== '') {
          parentDeviceTokens.push(parent.deviceToken);
        }
      }

      // Send FCM push notifications
      if (parentDeviceTokens.length > 0) {
        try {
          const fcmResult = await sendPushNotification(
            parentDeviceTokens,
            message,
            {
              type: 'student_picked_up',
              studentId: student._id.toString(),
              studentName: student.name,
              routeId: route._id.toString(),
              routeName: route.name,
              pickupTime: pickupTime.toISOString(),
              pickupTimeLocal: pickupTimeString
            },
            '✅ Student Boarded'
          );
          
          if (!fcmResult.success && fcmResult.error === 'FCM_API_NOT_ENABLED') {
            console.warn('⚠️  FCM API not enabled. Notifications saved to database but push notifications disabled.');
          }
        } catch (fcmError) {
          console.error('Error sending FCM notification for student pickup:', fcmError.message || fcmError);
          // Don't fail the request if FCM fails
        }
      } else {
        console.log(`ℹ️  No device tokens found for ${student.name}'s parents. Notifications saved to database.`);
      }
    }

    // Also emit to route room
    io.to(`route:${route._id}`).emit('student-picked-up', {
      studentId: student._id,
      studentName: student.name,
      pickupTime: pickupTime.toISOString(),
      pickupTimeLocal: pickupTimeString,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Student marked as picked up',
      student: {
        id: student._id.toString(),
        name: student.name,
        pickup: student.pickup
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark student as dropped
router.post('/student/drop', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const driverId = req.user._id;
    const { studentId, droppedAt } = req.body; // Accept timestamp from mobile phone

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Check if there's an active journey
    const activeJourney = await Journey.findOne({
      driverId: driverId,
      status: 'in_progress'
    });

    if (!activeJourney) {
      return res.status(400).json({ 
        success: false,
        message: 'No active journey. Please start a journey first.' 
      });
    }

    const driver = await Driver.findById(driverId).populate('currentRoute');
    
    // Verify student is on driver's route
    if (!driver.currentRoute) {
      return res.status(400).json({ 
        success: false,
        message: 'No route assigned to driver' 
      });
    }

    const route = await Route.findById(driver.currentRoute._id);
    if (!route.students.includes(studentId)) {
      return res.status(403).json({ 
        success: false,
        message: 'Student is not on your route' 
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Use mobile phone time if provided, otherwise use server time (fallback)
    let dropTime;
    if (droppedAt) {
      dropTime = new Date(droppedAt);
      // Validate the date
      if (isNaN(dropTime.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid timestamp format. Please provide a valid ISO 8601 timestamp.' 
        });
      }
    } else {
      dropTime = new Date();
    }

    // Update student drop time
    student.dropped = dropTime.toISOString();
    student.status = 'Active';
    student.updatedAt = dropTime;
    await student.save();
    
    // Populate parents for notifications
    await student.populate('parents');

    // Update journey student status
    const journeyStudent = activeJourney.students.find(
      s => s.studentId.toString() === studentId
    );
    if (journeyStudent) {
      journeyStudent.droppedAt = dropTime;
      journeyStudent.status = 'dropped';
      activeJourney.updatedAt = dropTime;
      await activeJourney.save();
    }

    // Create notifications for parents
    const io = getSocketIO();
    const dropTimeString = dropTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const message = `🏠 ${student.name} has been dropped off by the bus at ${dropTimeString}`;

    if (student.parents && student.parents.length > 0) {
      const parentDeviceTokens = [];
      
      for (const parent of student.parents) {
        await Notification.create({
          pid: parent._id,
          sid: route.sid,
          message,
          type: 'student_dropped',
          studentId: student._id
        });

        // Send real-time notification via Socket.io
        io.to(`parent:${parent._id}`).emit('notification', {
          type: 'student_dropped',
          studentId: student._id,
          studentName: student.name,
          message,
          dropTime: dropTime.toISOString(),
          dropTimeLocal: dropTimeString,
          timestamp: new Date().toISOString()
        });

        // Collect device tokens for FCM
        if (parent.deviceToken && parent.deviceToken.trim() !== '') {
          parentDeviceTokens.push(parent.deviceToken);
        }
      }

      // Send FCM push notifications
      if (parentDeviceTokens.length > 0) {
        try {
          const fcmResult = await sendPushNotification(
            parentDeviceTokens,
            message,
            {
              type: 'student_dropped',
              studentId: student._id.toString(),
              studentName: student.name,
              routeId: route._id.toString(),
              routeName: route.name,
              dropTime: dropTime.toISOString(),
              dropTimeLocal: dropTimeString
            },
            '🏠 Student Dropped'
          );
          
          if (!fcmResult.success && fcmResult.error === 'FCM_API_NOT_ENABLED') {
            console.warn('⚠️  FCM API not enabled. Notifications saved to database but push notifications disabled.');
          }
        } catch (fcmError) {
          console.error('Error sending FCM notification for student drop:', fcmError.message || fcmError);
          // Don't fail the request if FCM fails
        }
      } else {
        console.log(`ℹ️  No device tokens found for ${student.name}'s parents. Notifications saved to database.`);
      }
    }

    // Also emit to route room
    io.to(`route:${route._id}`).emit('student-dropped', {
      studentId: student._id,
      studentName: student.name,
      dropTime: dropTime.toISOString(),
      dropTimeLocal: dropTimeString,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Student marked as dropped',
      student: {
        id: student._id.toString(),
        name: student.name,
        dropped: student.dropped
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
