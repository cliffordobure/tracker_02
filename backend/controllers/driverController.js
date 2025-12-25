const Driver = require('../models/Driver');
const Journey = require('../models/Journey');
const Student = require('../models/Student');
const Route = require('../models/Route');
const Parent = require('../models/Parent');
const Manager = require('../models/Manager');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getSocketIO } = require('../services/socketService');
const { sendPushNotification } = require('../services/firebaseService');
const { emitNotification } = require('../utils/socketHelper');
const { getPhotoUrl } = require('../utils/photoHelper');

// Helper function to calculate speed using Haversine formula
function calculateSpeed(lat1, lon1, lat2, lon2, timeDiffSeconds) {
  if (timeDiffSeconds <= 0) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // distance in km
  
  // Speed in km/h
  const speed = (distance / timeDiffSeconds) * 3600;
  // Cap at reasonable maximum (e.g., 120 km/h)
  return Math.min(speed, 120);
}

// Helper function to find closest stop/point name for a student
const findPointName = async (student, route) => {
  if (!route || !route.stops || route.stops.length === 0) {
    return student.address || 'Unknown Location';
  }
  
  if (!student.latitude || !student.longitude) {
    return student.address || 'Unknown Location';
  }

  // Populate stops if they are ObjectIds
  let stops = route.stops;
  if (stops.length > 0) {
    // Check if first stop is already populated (has name/latitude properties)
    // If it's an ObjectId, it won't have these properties
    const firstStop = stops[0];
    if (firstStop && (firstStop.name || firstStop.latitude)) {
      // Already populated - use as is
    } else {
      // Need to populate - stops are ObjectIds
      const Stop = require('../models/Stop');
      stops = await Stop.find({ _id: { $in: route.stops }, isdeleted: false });
    }
  }

  // Find the closest stop to student's location
  let closestStop = null;
  let minDistance = Infinity;
  for (const stop of stops) {
    if (stop.latitude && stop.longitude) {
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (stop.latitude - student.latitude) * Math.PI / 180;
      const dLon = (stop.longitude - student.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(student.latitude * Math.PI / 180) * 
        Math.cos(stop.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        closestStop = stop;
      }
    }
  }

  // If found a stop within 500 meters, use its name, otherwise use address
  if (closestStop && minDistance < 0.5) {
    return closestStop.name || student.address || 'Unknown Location';
  }
  return student.address || 'Unknown Location';
};

// Update driver location with speed calculation
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.body; // Accept timestamp from mobile phone
    const driverId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinate ranges
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude and longitude must be numbers.'
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range. Latitude must be -90 to 90, longitude -180 to 180.'
      });
    }

    const driver = await Driver.findById(driverId).populate('currentRoute');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check driver status
    if (driver.status && driver.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Driver account is suspended. Cannot update location.'
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
          message: 'Invalid timestamp format. Please provide a valid ISO 8601 timestamp.'
        });
      }
    } else {
      updateTime = new Date();
    }

    // Calculate speed if previous location exists
    let speed = 0;
    if (driver.previousLatitude && driver.previousLongitude && driver.lastLocationUpdate) {
      const timeDiffSeconds = (updateTime - driver.lastLocationUpdate) / 1000;
      speed = calculateSpeed(
        driver.previousLatitude,
        driver.previousLongitude,
        lat,
        lng,
        timeDiffSeconds
      );
    }

    // Update driver location and speed
    driver.previousLatitude = driver.latitude;
    driver.previousLongitude = driver.longitude;
    driver.latitude = lat;
    driver.longitude = lng;
    driver.speed = speed;
    driver.lastLocationUpdate = updateTime;
    driver.updatedAt = updateTime;

    await driver.save();

    // Emit socket event with speed
    const io = getSocketIO();
    const locationData = {
      driverId: driver._id.toString(),
      driverName: driver.name,
      latitude: driver.latitude,
      longitude: driver.longitude,
      speed: driver.speed,
      routeId: driver.currentRoute?._id?.toString(),
      routeName: driver.currentRoute?.name || null,
      vehicleNumber: driver.vehicleNumber,
      timestamp: driver.lastLocationUpdate.toISOString()
    };

    // Broadcast to route room for parents tracking this route
    if (driver.currentRoute) {
      io.to(`route:${driver.currentRoute._id}`).emit('driver-location-update', locationData);
      io.to(`driver:${driver._id}`).emit('location-update', locationData);
    }
    
    // Also broadcast globally for admin/manager tracking
    io.emit('location-update', locationData);
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
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark student as picked up
exports.markStudentPickedUp = async (req, res) => {
  try {
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
    
    // Check if student is on route - either in Route.students array or Student.route field
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const routeIdString = driver.currentRoute._id.toString();
    const studentIdString = studentId.toString();
    const isStudentOnRoute = route.students.some(id => id.toString() === studentIdString) || 
                             (student.route && student.route.toString() === routeIdString);
    
    if (!isStudentOnRoute) {
      return res.status(403).json({
        success: false,
        message: 'Student is not on your route'
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

    // Get route to find pickup point name
    let pickupPointName = null;
    if (route) {
      pickupPointName = await findPointName(student, route);
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
    const pickupTimeString = pickupTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const message = `✅ ${student.name} has been picked up at ${pickupPointName}`;

    if (student.parents && student.parents.length > 0) {
      const parentDeviceTokens = [];
      
      for (const parent of student.parents) {
        const notificationData = {
          type: 'student_picked_up',
          studentId: student._id.toString(),
          studentName: student.name,
          routeId: student.route ? student.route.toString() : (route ? route._id.toString() : null),
          routeName: route ? route.name : null,
          pickupTime: pickupTime.toISOString(),
          pickupTimeLocal: pickupTimeString,
          pickupPointName: pickupPointName,
          message: message,
          timestamp: pickupTime.toISOString()
        };

        await Notification.create({
          pid: parent._id,
          sid: route.sid,
          message,
          type: 'student_picked_up',
          studentId: student._id
        });

        // Send real-time notification via Socket.io
        const room = `parent:${parent._id}`;
        emitNotification(io, room, notificationData);

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
              pickupTimeLocal: pickupTimeString,
              pickupPointName: pickupPointName
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
        pickup: student.pickup,
        pickupPointName: pickupPointName
      }
    });
  } catch (error) {
    console.error('Mark student picked up error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark student as dropped
exports.markStudentDropped = async (req, res) => {
  try {
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
    
    // Check if student is on route - either in Route.students array or Student.route field
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const routeIdString = driver.currentRoute._id.toString();
    const studentIdString = studentId.toString();
    const isStudentOnRoute = route.students.some(id => id.toString() === studentIdString) || 
                             (student.route && student.route.toString() === routeIdString);
    
    if (!isStudentOnRoute) {
      return res.status(403).json({
        success: false,
        message: 'Student is not on your route'
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

    // Get route to find drop point name
    let dropPointName = null;
    if (route) {
      dropPointName = await findPointName(student, route);
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
    const dropTimeString = dropTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const message = `🏠 ${student.name} has been dropped at ${dropPointName}`;

    if (student.parents && student.parents.length > 0) {
      const parentDeviceTokens = [];
      
      for (const parent of student.parents) {
        const notificationData = {
          type: 'student_dropped',
          studentId: student._id.toString(),
          studentName: student.name,
          routeId: student.route ? student.route.toString() : (route ? route._id.toString() : null),
          routeName: route ? route.name : null,
          dropTime: dropTime.toISOString(),
          dropTimeLocal: dropTimeString,
          dropPointName: dropPointName,
          message: message,
          timestamp: dropTime.toISOString()
        };

        await Notification.create({
          pid: parent._id,
          sid: route.sid,
          message,
          type: 'student_dropped',
          studentId: student._id
        });

        // Send real-time notification via Socket.io
        const room = `parent:${parent._id}`;
        emitNotification(io, room, notificationData);

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
              dropTimeLocal: dropTimeString,
              dropPointName: dropPointName
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
        dropped: student.dropped,
        dropPointName: dropPointName
      }
    });
  } catch (error) {
    console.error('Mark student dropped error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark student as skipped (cannot go from start to end)
exports.markStudentSkipped = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { studentId } = req.body;

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
    
    // Check if student is on route
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const routeIdString = driver.currentRoute._id.toString();
    const studentIdString = studentId.toString();
    const isStudentOnRoute = route.students.some(id => id.toString() === studentIdString) || 
                             (student.route && student.route.toString() === routeIdString);
    
    if (!isStudentOnRoute) {
      return res.status(403).json({
        success: false,
        message: 'Student is not on your route'
      });
    }

    // Update journey student status to skipped
    const journeyStudent = activeJourney.students.find(
      s => s.studentId.toString() === studentId
    );
    if (journeyStudent) {
      journeyStudent.status = 'skipped';
      activeJourney.updatedAt = new Date();
      await activeJourney.save();
    }

    res.json({
      success: true,
      message: 'Student marked as skipped',
      student: {
        id: student._id.toString(),
        name: student.name
      }
    });
  } catch (error) {
    console.error('Mark student skipped error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get driver's manager
exports.getManager = async (req, res) => {
  try {
    const driverId = req.driver._id;
    const driverSid = req.driver.sid;

    if (!driverSid) {
      return res.status(400).json({
        success: false,
        message: 'Driver does not have a school ID assigned'
      });
    }

    // Find manager for driver's school
    const manager = await Manager.findOne({ 
      sid: driverSid, 
      status: 'Active' 
    }).select('_id name email phone image status sid');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found for your school'
      });
    }

    res.json({
      success: true,
      manager: {
        _id: manager._id,
        id: manager._id.toString(),
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        photo: getPhotoUrl(manager.image || manager.photo || null), // Map image to photo
        status: manager.status,
        sid: manager.sid
      }
    });
  } catch (error) {
    console.error('Error getting manager for driver:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get parents list for driver (for messaging)
// Returns parents whose children are on the driver's current route
exports.getParents = async (req, res) => {
  try {
    console.log('📥 Driver getParents called');
    
    const driver = req.driver;
    const driverSid = driver.sid;

    if (!driverSid) {
      return res.status(400).json({
        success: false,
        message: 'Driver does not have a school ID assigned'
      });
    }

    // Get driver's current route
    const driverWithRoute = await Driver.findById(driver._id).populate('currentRoute');
    
    if (!driverWithRoute.currentRoute) {
      // If no route assigned, return empty array
      return res.json({
        success: true,
        data: [],
        message: 'No route assigned to driver'
      });
    }

    const routeId = driverWithRoute.currentRoute._id;
    
    // Get route with students to check Route.students array
    const route = await Route.findById(routeId).select('students').lean();
    const routeStudentIds = route?.students || [];

    // Build query to find students on driver's route
    // Students can be on route either by:
    // 1. Student.route field matching routeId
    // 2. Student._id in Route.students array
    const query = {
      $or: [
        { route: routeId },
        ...(routeStudentIds.length > 0 ? [{ _id: { $in: routeStudentIds } }] : [])
      ],
      isdelete: false,
      status: { $ne: 'Leave' },
      sid: driverSid
    };

    // If no students in Route.students array, only query by route field
    if (routeStudentIds.length === 0) {
      delete query.$or;
      query.route = routeId;
    }

    // Find all students on driver's route
    const studentsOnRoute = await Student.find(query)
      .select('_id name grade photo status parents')
      .populate({
        path: 'parents',
        select: '_id name email phone photo status',
        match: { status: 'Active' }
      })
      .sort({ name: 1 });

    // Get all unique parent IDs from students on route
    const parentIds = new Set();
    studentsOnRoute.forEach(student => {
      if (student.parents && Array.isArray(student.parents)) {
        student.parents.forEach(parent => {
          if (parent && parent.status === 'Active') {
            parentIds.add(parent._id.toString());
          }
        });
      }
    });

    if (parentIds.size === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No parents found for students on your route'
      });
    }

    // Convert to array of ObjectIds
    const parentObjectIds = Array.from(parentIds)
      .map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      })
      .filter(id => id !== null);

    // Get parents of students on driver's route
    const parents = await Parent.find({ 
      _id: { $in: parentObjectIds },
      status: 'Active'
    })
      .select('_id name email phone photo status sid')
      .sort({ name: 1 });

    // For each parent, get their students that are on the driver's route
    const parentsWithStudents = await Promise.all(
      parents.map(async (parent) => {
        // Get students of this parent that are on the driver's route
        const students = studentsOnRoute.filter(student => {
          if (!student.parents || !Array.isArray(student.parents)) {
            return false;
          }
          return student.parents.some(p => p._id.toString() === parent._id.toString());
        });

        return {
          _id: parent._id,
          id: parent._id.toString(),
          name: parent.name,
          email: parent.email,
          phone: parent.phone || null,
          photo: getPhotoUrl(parent.photo || null),
          status: parent.status,
          students: students.map(student => ({
            _id: student._id,
            id: student._id.toString(),
            name: student.name,
            grade: student.grade || null,
            photo: getPhotoUrl(student.photo || null),
            status: student.status
          })),
          sid: parent.sid ? parent.sid.toString() : null
        };
      })
    );

    res.json({
      success: true,
      data: parentsWithStudents
    });
  } catch (error) {
    console.error('Error getting parents for driver:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get students list for driver (for messaging)
// Returns students on the driver's current route
exports.getStudents = async (req, res) => {
  try {
    const driver = req.driver;
    const driverSid = driver.sid;

    if (!driverSid) {
      return res.status(400).json({
        success: false,
        message: 'Driver does not have a school ID assigned'
      });
    }

    // Get driver's current route
    const driverWithRoute = await Driver.findById(driver._id).populate('currentRoute');
    
    if (!driverWithRoute.currentRoute) {
      // If no route assigned, return empty array
      return res.json({
        success: true,
        data: [],
        message: 'No route assigned to driver'
      });
    }

    const routeId = driverWithRoute.currentRoute._id;
    
    // Get route with students to check Route.students array
    const route = await Route.findById(routeId).select('students').lean();
    const routeStudentIds = route?.students || [];

    // Build query to find students on driver's route
    const query = {
      $or: [
        { route: routeId },
        ...(routeStudentIds.length > 0 ? [{ _id: { $in: routeStudentIds } }] : [])
      ],
      isdelete: false,
      status: { $ne: 'Leave' },
      sid: driverSid
    };

    // If no students in Route.students array, only query by route field
    if (routeStudentIds.length === 0) {
      delete query.$or;
      query.route = routeId;
    }

    // Find all active students on driver's route
    const students = await Student.find(query)
      .select('_id name grade photo status parents')
      .populate({
        path: 'parents',
        select: '_id name email phone photo status',
        match: { status: 'Active' }
      })
      .sort({ name: 1 });

    // Format response
    const formattedStudents = students.map(student => ({
      _id: student._id,
      id: student._id.toString(),
      name: student.name,
      grade: student.grade || null,
      photo: getPhotoUrl(student.photo || null),
      status: student.status,
      parents: (student.parents || []).map(parent => ({
        _id: parent._id,
        id: parent._id.toString(),
        name: parent.name,
        email: parent.email,
        phone: parent.phone || null,
        photo: getPhotoUrl(parent.photo || null)
      }))
    }));

    res.json({
      success: true,
      data: formattedStudents
    });
  } catch (error) {
    console.error('Error getting students for driver:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update driver profile
exports.updateProfile = async (req, res) => {
  try {
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
        photo: getPhotoUrl(driver.photo || null),
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
};

