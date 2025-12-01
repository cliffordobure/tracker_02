const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Route = require('../models/Route');
const Driver = require('../models/Driver');

router.use(authenticate);

// Get all routes
router.get('/', async (req, res) => {
  try {
    let query = { isdeleted: false };
    
    if (req.userRole === 'manager') {
      const managerSchoolId = req.user.sid?._id || req.user.sid;
      query.sid = managerSchoolId;
    }

    const routes = await Route.find(query)
      .populate('sid', 'name')
      .populate('driver', 'name email')
      .populate('stops')
      .populate('students', 'name')
      .sort({ createdAt: -1 });

    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get route by ID
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('sid', 'name')
      .populate('driver', 'name email')
      .populate('stops')
      .populate('students', 'name');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create route
router.post('/', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, driver, stops, students } = req.body;

    const managerSchoolId = req.user.sid?._id || req.user.sid;
    
    const route = new Route({
      name,
      sid: managerSchoolId,
      driver: driver || null,
      stops: stops || [],
      students: students || []
    });

    await route.save();

    // Update driver's current route if assigned
    if (driver) {
      await Driver.findByIdAndUpdate(driver, { currentRoute: route._id });
    }

    res.status(201).json({ message: 'Route created successfully', route });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update route
router.put('/:id', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, driver, stops, students } = req.body;

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const routeSchoolId = route.sid?._id || route.sid;
    const managerSchoolId = req.user.sid?._id || req.user.sid;
    
    if (routeSchoolId.toString() !== managerSchoolId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name) route.name = name;
    if (driver !== undefined) {
      // Update old driver
      if (route.driver) {
        await Driver.findByIdAndUpdate(route.driver, { currentRoute: null });
      }
      route.driver = driver || null;
      // Update new driver
      if (driver) {
        await Driver.findByIdAndUpdate(driver, { currentRoute: route._id });
      }
    }
    if (stops) route.stops = stops;
    if (students) route.students = students;
    route.updatedAt = Date.now();

    await route.save();
    res.json({ message: 'Route updated successfully', route });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete route (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    route.isdeleted = true;
    await route.save();

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

