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

    // Calculate speed if we have previous location
    let speed = 0;
    if (driver.previousLatitude && driver.previousLongitude && driver.lastLocationUpdate) {
      const timeDiff = (Date.now() - driver.lastLocationUpdate.getTime()) / 1000; // seconds
      if (timeDiff > 0) {
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
        speed = (distance / timeDiff) * 3600;
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
    driver.lastLocationUpdate = new Date();
    driver.updatedAt = Date.now();
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
    // Also broadcast to managers room
    io.to('managers').emit('location-update', locationData);
    io.to('managers').emit('driver-location-update', locationData);

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

    // Create Journey record for history
    const journeyStartedAt = new Date();
    const journeyStudents = route.students.map(student => ({
      studentId: student._id,
      status: 'pending'
    }));

    const journey = await Journey.create({
      driverId: driver._id,
      routeId: route._id,
      status: 'in_progress',
      journeyType: journeyType,
      startedAt: journeyStartedAt,
      students: journeyStudents
    });

    // Store journey ID in driver for reference
    driver.currentJourneyId = journey._id;
    await driver.save();

    // If driver has location data, emit it so managers can see the bus on map
    if (driver.latitude && driver.longitude) {
      const locationData = {
        driverId: driver._id.toString(),
        driverName: driver.name,
        latitude: driver.latitude,
        longitude: driver.longitude,
        routeId: driver.currentRoute?._id?.toString(),
        routeName: driver.currentRoute?.name,
        vehicleNumber: driver.vehicleNumber,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to managers and admins (global broadcast)
      io.emit('location-update', locationData);
      io.emit('driver-location-update', locationData);
      
      // Also emit to route room
      if (driver.currentRoute) {
        io.to(`route:${driver.currentRoute._id}`).emit('driver-location-update', locationData);
      }
      
      // Broadcast to managers room specifically
      io.to('managers').emit('location-update', locationData);
      io.to('managers').emit('driver-location-update', locationData);
    }

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
        const fcmResult = await sendPushNotification(
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
        
        if (!fcmResult.success && fcmResult.error === 'FCM_API_NOT_ENABLED') {
          console.warn('⚠️  FCM API not enabled. Notifications saved to database but push notifications disabled.');
        }
      } catch (fcmError) {
        console.error('Error sending FCM notification for journey start:', fcmError.message || fcmError);
        // Don't fail the request if FCM fails
      }
    } else {
      console.log(`ℹ️  No device tokens found for parents on route ${route.name}. Notifications saved to database.`);
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

    const pickupTime = new Date();
    const student = await Student.findByIdAndUpdate(
      studentId,
      { 
        pickup: pickupTime.toISOString(),
        status: 'Active'
      },
      { new: true }
    ).populate('parents');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update Journey record if exists
    const driverWithJourney = await Driver.findById(req.user._id);
    if (driverWithJourney.currentJourneyId) {
      await Journey.updateOne(
        { _id: driverWithJourney.currentJourneyId, 'students.studentId': studentId },
        {
          $set: {
            'students.$.pickedUpAt': pickupTime,
            'students.$.status': 'picked_up'
          }
        }
      );
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

    const dropTime = new Date();
    const student = await Student.findByIdAndUpdate(
      studentId,
      { 
        dropped: dropTime.toISOString(),
        status: 'Active'
      },
      { new: true }
    ).populate('parents');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update Journey record if exists
    const driverWithJourney = await Driver.findById(req.user._id);
    if (driverWithJourney.currentJourneyId) {
      await Journey.updateOne(
        { _id: driverWithJourney.currentJourneyId, 'students.studentId': studentId },
        {
          $set: {
            'students.$.droppedAt': dropTime,
            'students.$.status': 'dropped'
          }
        }
      );
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

    // Store journey type before clearing driver data
    const journeyType = driver.journeyType || (new Date().getHours() < 12 ? 'pickup' : 'drop-off');

    // Update Journey record if exists
    const endedAt = new Date();
    if (driver.currentJourneyId) {
      // Get current student pickup/drop times from Student model
      const routeWithStudents = await Route.findById(route._id).populate('students');
      
      // Update each student in the journey
      for (const student of routeWithStudents.students) {
        const updateData = {};
        if (student.pickup) {
          updateData['students.$.pickedUpAt'] = new Date(student.pickup);
          if (student.dropped) {
            updateData['students.$.droppedAt'] = new Date(student.dropped);
            updateData['students.$.status'] = 'dropped';
          } else {
            updateData['students.$.status'] = 'picked_up';
          }
        } else if (student.dropped) {
          updateData['students.$.droppedAt'] = new Date(student.dropped);
          updateData['students.$.status'] = 'dropped';
        }

        if (Object.keys(updateData).length > 0) {
          await Journey.updateOne(
            { _id: driver.currentJourneyId, 'students.studentId': student._id },
            { $set: updateData }
          );
        }
      }

      // Mark journey as completed
      await Journey.findByIdAndUpdate(
        driver.currentJourneyId,
        {
          status: 'completed',
          endedAt: endedAt
        }
      );
    }

    // Update driver journey status
    driver.journeyStatus = 'completed';
    driver.currentJourneyId = null; // Clear current journey reference
    await driver.save();

    // Get Socket.io instance
    const io = getSocketIO();
    
    // Create notification message based on journey type
    const notificationMessage = journeyType === 'pickup'
      ? `🏁 The bus has completed the morning pickup journey. Route: ${route.name}`
      : `🏁 The bus has completed the afternoon drop-off journey. Route: ${route.name}`;

    // Get all parents on the route for notifications
    const routeWithStudents = await Route.findById(route._id)
      .populate({
        path: 'students',
        populate: {
          path: 'parents',
          select: 'name email phone deviceToken'
        }
      });

    // Collect all unique parent IDs and device tokens
    const parentIds = new Set();
    const parentDeviceTokens = [];
    
    routeWithStudents.students.forEach(student => {
      if (student.parents && student.parents.length > 0) {
        student.parents.forEach(parent => {
          parentIds.add(parent._id);
          
          // Collect device tokens (filter out placeholders)
          if (parent.deviceToken && 
              parent.deviceToken.trim() !== '' && 
              parent.deviceToken.length > 50 &&
              parent.deviceToken.toLowerCase() !== 'device_token') {
            parentDeviceTokens.push(parent.deviceToken);
          }
        });
      }
    });

    // Remove duplicate tokens
    const uniqueTokens = [...new Set(parentDeviceTokens)];

    // Create database notifications for all parents
    const notifications = [];
    for (const parentId of parentIds) {
      const notification = await Notification.create({
        pid: parentId,
        sid: route.sid,
        message: notificationMessage,
        type: 'journey_ended',
        routeId: route._id
      });
      notifications.push(notification);
    }

    // Send real-time notifications via Socket.io
    const notificationData = {
      type: 'journey_ended',
      routeId: route._id,
      routeName: route.name,
      driverId: driver._id,
      driverName: driver.name,
      journeyType: journeyType,
      message: notificationMessage,
      timestamp: new Date().toISOString()
    };

    // Emit to all parents on the route
    parentIds.forEach(parentId => {
      io.to(`parent:${parentId}`).emit('notification', notificationData);
    });

    // Emit journey end to route room
    io.to(`route:${route._id}`).emit('journey-ended', notificationData);

    // Send FCM push notifications to all parents
    if (uniqueTokens.length > 0) {
      try {
        const fcmResult = await sendPushNotification(
          uniqueTokens,
          notificationMessage,
          {
            type: 'journey_ended',
            routeId: route._id.toString(),
            routeName: route.name,
            journeyType: journeyType,
            driverId: driver._id.toString(),
            driverName: driver.name
          },
          '🏁 Journey Completed'
        );
        
        if (!fcmResult.success && fcmResult.error === 'FCM_API_NOT_ENABLED') {
          console.warn('⚠️  FCM API not enabled. Notifications saved to database but push notifications disabled.');
        } else if (fcmResult.success) {
          console.log(`✅ FCM: Journey end notifications sent - ${fcmResult.successCount} successful, ${fcmResult.failureCount} failed`);
        }
      } catch (fcmError) {
        console.error('Error sending FCM notification for journey end:', fcmError.message || fcmError);
        // Don't fail the request if FCM fails
      }
    } else {
      console.log(`ℹ️  No device tokens found for parents on route ${route.name}. Notifications saved to database.`);
    }

    res.json({
      success: true,
      message: 'Journey ended successfully',
      journeyType: journeyType,
      route: {
        id: route._id,
        name: route.name
      },
      studentsCount: routeWithStudents.students.length,
      notificationsSent: notifications.length,
      fcmNotificationsSent: uniqueTokens.length,
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
