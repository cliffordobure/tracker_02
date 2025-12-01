const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Stop = require('../models/Stop');

router.use(authenticate);

// Get all stops
router.get('/', async (req, res) => {
  try {
    let query = { isdeleted: false };
    
    if (req.userRole === 'manager') {
      query.sid = req.user.sid;
    }

    const stops = await Stop.find(query)
      .populate('sid', 'name')
      .sort({ order: 1, createdAt: -1 });

    res.json(stops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stop by ID
router.get('/:id', async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id).populate('sid', 'name');
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    res.json(stop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create stop
router.post('/', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, latitude, longitude, address, order } = req.body;

    const stop = new Stop({
      name,
      sid: req.user.sid,
      latitude,
      longitude,
      address,
      order: order || 0
    });

    await stop.save();
    res.status(201).json({ message: 'Stop created successfully', stop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update stop
router.put('/:id', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, latitude, longitude, address, order } = req.body;

    const stop = await Stop.findById(req.params.id);
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    if (stop.sid.toString() !== req.user.sid.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name) stop.name = name;
    if (latitude !== undefined) stop.latitude = latitude;
    if (longitude !== undefined) stop.longitude = longitude;
    if (address !== undefined) stop.address = address;
    if (order !== undefined) stop.order = order;
    stop.updatedAt = Date.now();

    await stop.save();
    res.json({ message: 'Stop updated successfully', stop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete stop (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stop = await Stop.findByIdAndUpdate(
      req.params.id,
      { isdeleted: true },
      { new: true }
    );

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    res.json({ message: 'Stop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

