const Journey = require('../models/Journey');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Student = require('../models/Student');

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
      return res.status(400).json({
        success: false,
        message: 'You already have an active trip. Please end the current trip before starting a new one.',
        activeJourneyId: activeJourney._id
      });
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

    // Get all students for this route
    const students = await Student.find({ route: driver.currentRoute._id });

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
        { $set: { pickup: '' } }
      );
    } else {
      // Reset drop times for afternoon drop-off
      await Student.updateMany(
        { route: driver.currentRoute._id },
        { $set: { dropped: '' } }
      );
    }

    await journey.save();

    res.json({
      success: true,
      message: 'Journey started successfully',
      journeyType: journeyType,
      route: {
        id: driver.currentRoute._id.toString(),
        name: driver.currentRoute.name
      },
      studentsCount: students.length,
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

    res.json({
      success: true,
      message: 'Journey ended successfully',
      journey: {
        id: journey._id.toString(),
        startedAt: journey.startedAt,
        endedAt: journey.endedAt
      }
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

