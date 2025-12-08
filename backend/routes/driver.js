const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Notification = require('../models/Notification');
const { getSocketIO } = require('../services/socketService');
const { sendPushNotification } = require('../services/firebaseService');

router.use(authenticate);

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

    const { latitude, longitude } = req.body;

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

    // Update driver location
    driver.latitude = lat;
    driver.longitude = lng;
    driver.updatedAt = Date.now();
    await driver.save();

    // Emit location update via socket.io to route-specific room
    const io = getSocketIO();
    const locationData = {
      driverId: driver._id,
      driverName: driver.name,
      latitude: lat,
      longitude: lng,
      routeId: driver.currentRoute?._id,
      routeName: driver.currentRoute?.name,
      timestamp: new Date().toISOString()
    };

    // Broadcast to route room for parents tracking this route
    if (driver.currentRoute) {
      io.to(`route:${driver.currentRoute._id}`).emit('driver-location-update', locationData);
      // Also emit to driver room
      io.to(`driver:${driver._id}`).emit('location-update', locationData);
    }
    
    // Also broadcast globally for admin/manager tracking
    io.emit('location-update', locationData);

    res.json({ 
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude: driver.latitude,
        longitude: driver.longitude,
        timestamp: driver.updatedAt
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
router.post('/journey/start', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const driver = await Driver.findById(req.user._id).populate('currentRoute');
    
    if (!driver.currentRoute) {
      return res.status(400).json({ message: 'No route assigned to driver' });
    }

    const route = await Route.findById(driver.currentRoute._id)
      .populate({
        path: 'students',
        populate: {
          path: 'parents',
          select: 'name email phone deviceToken'
        }
      });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Determine if morning pickup or afternoon drop-off
    const hour = new Date().getHours();
    const isMorning = hour < 12;
    const journeyType = isMorning ? 'pickup' : 'drop-off';

    // Reset students' status in the morning (before 12 PM)
    if (isMorning) {
      await Student.updateMany(
        { _id: { $in: route.students.map(s => s._id) } },
        { $set: { pickup: '', dropped: '', status: 'Active' } }
      );
    } else {
      // Reset for afternoon drop-off
      await Student.updateMany(
        { _id: { $in: route.students.map(s => s._id) } },
        { $set: { dropped: '', status: 'Active' } }
      );
    }

    // Create message for notifications
    const message = isMorning
      ? `🚌 The bus is now leaving school for morning pickup. Route: ${route.name}`
      : `🚌 The bus is now leaving school for afternoon drop-off. Route: ${route.name}`;

    // Get all unique parent IDs from students on this route
    const parentIds = new Set();
    route.students.forEach(student => {
      if (student.parents && student.parents.length > 0) {
        student.parents.forEach(parent => {
          parentIds.add(parent._id);
        });
      }
    });

    // Create notifications for all parents
    const notifications = [];
    for (const parentId of parentIds) {
      const notification = await Notification.create({
        pid: parentId,
        sid: route.sid,
        message,
        type: 'journey_started',
        routeId: route._id
      });
      notifications.push(notification);
    }

    // Get Socket.io instance
    const io = getSocketIO();

    // Send real-time notifications to parents via Socket.io
    const notificationData = {
      type: 'journey_started',
      routeId: route._id,
      routeName: route.name,
      driverId: driver._id,
      driverName: driver.name,
      journeyType,
      message,
      timestamp: new Date().toISOString(),
      students: route.students.map(s => ({
        id: s._id,
        name: s.name
      }))
    };

    // Emit to all parents connected to this route
    parentIds.forEach(parentId => {
      io.to(`parent:${parentId}`).emit('notification', notificationData);
      io.to(`route:${route._id}`).emit('journey-started', notificationData);
    });

    // Emit journey start to route room
    io.to(`route:${route._id}`).emit('journey-started', notificationData);

    // Update driver journey status
    driver.journeyStatus = 'active';
    driver.journeyStartedAt = new Date();
    driver.journeyType = journeyType;
    await driver.save();

    // Send FCM push notifications to all parents
    const parentDeviceTokens = [];
    route.students.forEach(student => {
      if (student.parents && student.parents.length > 0) {
        student.parents.forEach(parent => {
          if (parent.deviceToken && parent.deviceToken.trim() !== '') {
            parentDeviceTokens.push(parent.deviceToken);
          }
        });
      }
    });

    if (parentDeviceTokens.length > 0) {
      try {
        await sendPushNotification(
          parentDeviceTokens,
          message,
          {
            type: 'journey_started',
            routeId: route._id.toString(),
            routeName: route.name,
            journeyType: journeyType,
            driverId: driver._id.toString(),
            driverName: driver.name
          },
          '🚌 Journey Started'
        );
      } catch (fcmError) {
        console.error('Error sending FCM notification for journey start:', fcmError);
        // Don't fail the request if FCM fails
      }
    }

    res.json({
      success: true,
      message: 'Journey started successfully',
      journeyType,
      route: {
        id: route._id,
        name: route.name
      },
      studentsCount: route.students.length,
      notificationsSent: notifications.length,
      journeyStatus: 'active'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark student as picked up
router.post('/student/pickup', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const driver = await Driver.findById(req.user._id).populate('currentRoute');
    
    // Verify student is on driver's route
    if (!driver.currentRoute) {
      return res.status(400).json({ message: 'No route assigned to driver' });
    }

    const route = await Route.findById(driver.currentRoute._id);
    if (!route.students.includes(studentId)) {
      return res.status(403).json({ message: 'Student is not on your route' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { 
        pickup: new Date().toISOString(),
        status: 'Active'
      },
      { new: true }
    ).populate('parents');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create notifications for parents
    const io = getSocketIO();
    const message = `✅ ${student.name} has been picked up by the bus`;

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
          await sendPushNotification(
            parentDeviceTokens,
            message,
            {
              type: 'student_picked_up',
              studentId: student._id.toString(),
              studentName: student.name,
              routeId: route._id.toString(),
              routeName: route.name
            },
            '✅ Student Boarded'
          );
        } catch (fcmError) {
          console.error('Error sending FCM notification for student pickup:', fcmError);
          // Don't fail the request if FCM fails
        }
      }
    }

    // Also emit to route room
    io.to(`route:${route._id}`).emit('student-picked-up', {
      studentId: student._id,
      studentName: student.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Student marked as picked up',
      student: {
        id: student._id,
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
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const driver = await Driver.findById(req.user._id).populate('currentRoute');
    
    // Verify student is on driver's route
    if (!driver.currentRoute) {
      return res.status(400).json({ message: 'No route assigned to driver' });
    }

    const route = await Route.findById(driver.currentRoute._id);
    if (!route.students.includes(studentId)) {
      return res.status(403).json({ message: 'Student is not on your route' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { 
        dropped: new Date().toISOString(),
        status: 'Active'
      },
      { new: true }
    ).populate('parents');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create notifications for parents
    const io = getSocketIO();
    const message = `🏠 ${student.name} has been dropped off by the bus`;

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
          await sendPushNotification(
            parentDeviceTokens,
            message,
            {
              type: 'student_dropped',
              studentId: student._id.toString(),
              studentName: student.name,
              routeId: route._id.toString(),
              routeName: route.name
            },
            '🏠 Student Dropped'
          );
        } catch (fcmError) {
          console.error('Error sending FCM notification for student drop:', fcmError);
          // Don't fail the request if FCM fails
        }
      }
    }

    // Also emit to route room
    io.to(`route:${route._id}`).emit('student-dropped', {
      studentId: student._id,
      studentName: student.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Student marked as dropped',
      student: {
        id: student._id,
        name: student.name,
        dropped: student.dropped
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End journey/trip
router.post('/journey/end', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    const driver = await Driver.findById(req.user._id).populate('currentRoute');
    
    if (!driver.currentRoute) {
      return res.status(400).json({ 
        success: false,
        message: 'No route assigned to driver',
        error: 'NO_ROUTE_ASSIGNED'
      });
    }

    const route = await Route.findById(driver.currentRoute._id);

    // Update driver journey status
    driver.journeyStatus = 'completed';
    await driver.save();

    // Get Socket.io instance
    const io = getSocketIO();

    // Emit journey end to route room
    io.to(`route:${route._id}`).emit('journey-ended', {
      routeId: route._id,
      routeName: route.name,
      driverId: driver._id,
      driverName: driver.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Journey ended successfully',
      route: {
        id: route._id,
        name: route.name
      },
      journeyStatus: 'completed'
    });
  } catch (error) {
    console.error('Error ending journey:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get journey status (students picked/dropped count)
router.get('/journey/status', async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    const driver = await Driver.findById(req.user._id).populate('currentRoute');
    
    if (!driver.currentRoute) {
      return res.json({
        success: true,
        message: 'No route assigned',
        route: null,
        status: null,
        journeyStatus: driver.journeyStatus || 'idle'
      });
    }

    const route = await Route.findById(driver.currentRoute._id).populate('students');
    
    const hour = new Date().getHours();
    const isMorning = hour < 12;

    let total = route.students.length;
    let completed = 0;

    if (isMorning) {
      completed = route.students.filter(s => s.pickup).length;
    } else {
      completed = route.students.filter(s => s.dropped).length;
    }

    const students = route.students.map(student => ({
      id: student._id,
      name: student.name,
      pickup: student.pickup,
      dropped: student.dropped,
      status: student.status
    }));

    res.json({
      success: true,
      message: 'success',
      route: {
        id: route._id,
        name: route.name
      },
      journeyType: isMorning ? 'pickup' : 'drop-off',
      journeyStatus: driver.journeyStatus || 'idle',
      status: {
        total,
        completed,
        remaining: total - completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      },
      students
    });
  } catch (error) {
    console.error('Error fetching journey status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
