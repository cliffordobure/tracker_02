const Journey = require('../models/Journey');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { getSocketIO } = require('../services/socketService');
const { sendPushNotification } = require('../services/firebaseService');

// Start Journey
exports.startJourney = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { startedAt } = req.body; // Accept timestamp from mobile phone

    // Get driver with route
    const driver = await Driver.findById(driverId).populate('currentRoute');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    if (!driver.currentRoute) {
      return res.status(400).json({
        success: false,
        message: 'No route assigned to driver. Please select a route first.'
      });
    }

    // Check if there's an active journey (in_progress)
    const activeJourney = await Journey.findOne({
      driverId: driverId,
      status: 'in_progress'
    });

    if (activeJourney) {
      // Optional: Auto-cleanup if journey is older than 24 hours
      const hoursSinceStart = (Date.now() - activeJourney.startedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceStart > 24) {
        // Auto-end old stuck journeys
        activeJourney.status = 'completed';
        activeJourney.endedAt = new Date();
        activeJourney.updatedAt = new Date();
        await activeJourney.save();
        console.log(`Auto-ended stuck journey ${activeJourney._id} (${hoursSinceStart.toFixed(1)} hours old)`);
      } else {
        // Journey is recent, require manual end
        return res.status(400).json({
          success: false,
          message: 'You already have an active trip. Please end the current trip before starting a new one.',
          activeJourneyId: activeJourney._id
        });
      }
    }

    // Use mobile phone time if provided, otherwise use server time (fallback)
    let journeyStartTime;
    if (startedAt) {
      journeyStartTime = new Date(startedAt);
      // Validate the date
      if (isNaN(journeyStartTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timestamp format. Please provide a valid ISO 8601 timestamp.'
        });
      }
    } else {
      journeyStartTime = new Date();
    }

    // Determine journey type based on mobile phone time (before 12 PM = pickup, after = drop-off)
    const hour = journeyStartTime.getHours();
    const journeyType = hour < 12 ? 'pickup' : 'drop-off';

    // Get all students for this route (excluding deleted and on leave)
    const students = await Student.find({ 
      route: driver.currentRoute._id,
      isdelete: false,
      status: { $ne: 'Leave' }
    }).populate('parents', 'name email phone deviceToken');

    // Filter students based on journey type - only notify parents of students not yet picked/dropped
    let studentsToNotify = [];
    if (journeyType === 'pickup') {
      // For pickup: only notify parents of students who haven't been picked up yet
      studentsToNotify = students.filter(student => !student.pickup);
    } else {
      // For drop-off: only notify parents of students who haven't been dropped yet
      studentsToNotify = students.filter(student => !student.dropped);
    }

    // Create journey with student list
    const journey = new Journey({
      driverId: driverId,
      routeId: driver.currentRoute._id,
      status: 'in_progress',
      journeyType: journeyType,
      startedAt: journeyStartTime,
      students: students.map(student => ({
        studentId: student._id,
        status: 'pending'
      }))
    });

    // Reset student pickup/drop times based on journey type
    if (journeyType === 'pickup') {
      // Reset pickup times for morning pickup
      await Student.updateMany(
        { route: driver.currentRoute._id },
        { $set: { pickup: null } }
      );
    } else {
      // Reset drop times for afternoon drop-off
      await Student.updateMany(
        { route: driver.currentRoute._id },
        { $set: { dropped: null } }
      );
    }

    await journey.save();

    // Send notifications only to parents of students who haven't been picked/dropped yet
    const io = getSocketIO();
    const notificationMessage = journeyType === 'pickup' 
      ? `🚌 The bus is now leaving school for morning pickup. Route: ${driver.currentRoute.name}`
      : `🚌 The bus is now leaving school for afternoon drop-off. Route: ${driver.currentRoute.name}`;
    
    const parentDeviceTokens = [];
    const parentIds = new Set(); // Track unique parent IDs to avoid duplicate notifications

    for (const student of studentsToNotify) {
      if (student.parents && student.parents.length > 0) {
        for (const parent of student.parents) {
          // Only send notification once per parent (in case parent has multiple students)
          if (!parentIds.has(parent._id.toString())) {
            parentIds.add(parent._id.toString());

            // Create notification record
            await Notification.create({
              pid: parent._id,
              sid: driver.sid,
              message: notificationMessage,
              type: 'journey_started',
              routeId: driver.currentRoute._id
            });

            // Send real-time notification via Socket.io
            io.to(`parent:${parent._id}`).emit('notification', {
              type: 'journey_started',
              routeId: driver.currentRoute._id.toString(),
              routeName: driver.currentRoute.name,
              journeyType: journeyType,
              driverId: driverId.toString(),
              driverName: driver.name,
              timestamp: new Date().toISOString()
            });

            // Collect device tokens for FCM
            if (parent.deviceToken && parent.deviceToken.trim() !== '') {
              parentDeviceTokens.push(parent.deviceToken);
            }
          }
        }
      }
    }

    // Send FCM push notifications (async, don't wait)
    if (parentDeviceTokens.length > 0) {
      sendPushNotification(
        parentDeviceTokens,
        notificationMessage,
        {
          type: 'journey_started',
          routeId: driver.currentRoute._id.toString(),
          routeName: driver.currentRoute.name,
          journeyType: journeyType,
          driverId: driverId.toString(),
          driverName: driver.name
        },
        '🚌 Journey Started'
      ).catch(error => {
        console.error('Error sending FCM notifications for journey start:', error);
      });
    }

    res.json({
      success: true,
      message: 'Journey started successfully',
      journeyType: journeyType,
      route: {
        id: driver.currentRoute._id.toString(),
        name: driver.currentRoute.name
      },
      studentsCount: students.length,
      notificationsSent: parentIds.size,
      journeyStatus: 'active',
      startedAt: journey.startedAt
    });
  } catch (error) {
    console.error('Start journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// End Journey
exports.endJourney = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { endedAt } = req.body; // Accept timestamp from mobile phone

    // Find active journey
    const journey = await Journey.findOne({
      driverId: driverId,
      status: 'in_progress'
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey found'
      });
    }

    // Use mobile phone time if provided, otherwise use server time (fallback)
    let journeyEndTime;
    if (endedAt) {
      journeyEndTime = new Date(endedAt);
      // Validate the date
      if (isNaN(journeyEndTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timestamp format. Please provide a valid ISO 8601 timestamp.'
        });
      }
    } else {
      journeyEndTime = new Date();
    }

    journey.status = 'completed';
    journey.endedAt = journeyEndTime;
    journey.updatedAt = new Date();
    await journey.save();

    // Get route and driver info for notifications
    const route = await Route.findById(journey.routeId);
    const driver = await Driver.findById(driverId);

    // Get all students for this route (excluding deleted and on leave)
    const students = await Student.find({ 
      route: journey.routeId,
      isdelete: false,
      status: { $ne: 'Leave' }
    }).populate('parents', 'name email phone deviceToken');

    // Send notifications only to parents of students on this route
    const io = getSocketIO();
    const notificationMessage = `✅ The bus journey has ended. Route: ${route?.name || 'Unknown'}`;
    
    const parentDeviceTokens = [];
    const parentIds = new Set(); // Track unique parent IDs to avoid duplicate notifications

    for (const student of students) {
      if (student.parents && student.parents.length > 0) {
        for (const parent of student.parents) {
          // Only send notification once per parent (in case parent has multiple students)
          if (!parentIds.has(parent._id.toString())) {
            parentIds.add(parent._id.toString());

            // Create notification record
            await Notification.create({
              pid: parent._id,
              sid: driver?.sid,
              message: notificationMessage,
              type: 'journey_ended',
              routeId: journey.routeId
            });

            // Send real-time notification via Socket.io
            io.to(`parent:${parent._id}`).emit('notification', {
              type: 'journey_ended',
              routeId: journey.routeId.toString(),
              routeName: route?.name || 'Unknown',
              driverId: driverId.toString(),
              driverName: driver?.name || 'Driver',
              timestamp: new Date().toISOString()
            });

            // Collect device tokens for FCM
            if (parent.deviceToken && parent.deviceToken.trim() !== '') {
              parentDeviceTokens.push(parent.deviceToken);
            }
          }
        }
      }
    }

    // Send FCM push notifications (async, don't wait)
    if (parentDeviceTokens.length > 0) {
      sendPushNotification(
        parentDeviceTokens,
        notificationMessage,
        {
          type: 'journey_ended',
          routeId: journey.routeId.toString(),
          routeName: route?.name || 'Unknown',
          driverId: driverId.toString(),
          driverName: driver?.name || 'Driver'
        },
        '✅ Journey Ended'
      ).catch(error => {
        console.error('Error sending FCM notifications for journey end:', error);
      });
    }

    res.json({
      success: true,
      message: 'Journey ended successfully',
      journey: {
        id: journey._id.toString(),
        startedAt: journey.startedAt,
        endedAt: journey.endedAt
      },
      notificationsSent: parentIds.size
    });
  } catch (error) {
    console.error('End journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get active journey status
exports.getJourneyStatus = async (req, res) => {
  try {
    const driverId = req.user._id;
    const journey = await Journey.findOne({
      driverId: driverId,
      status: 'in_progress'
    }).populate('routeId', 'name').populate('students.studentId', 'name photo grade');

    if (!journey) {
      return res.json({
        success: true,
        hasActiveJourney: false,
        journey: null
      });
    }

    res.json({
      success: true,
      hasActiveJourney: true,
      journey: {
        id: journey._id.toString(),
        route: {
          id: journey.routeId._id.toString(),
          name: journey.routeId.name
        },
        journeyType: journey.journeyType,
        startedAt: journey.startedAt,
        studentsCount: journey.students.length
      }
    });
  } catch (error) {
    console.error('Get journey status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

