const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const School = require('../models/School');

router.use(authenticate);

// Get all schools (admin) or own school (manager)
router.get('/', async (req, res) => {
  try {
    let schools;
    if (req.userRole === 'admin') {
      schools = await School.find({}).sort({ createdAt: -1 });
    } else if (req.userRole === 'manager') {
      schools = await School.findById(req.user.sid);
      schools = schools ? [schools] : [];
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get school by ID
router.get('/:id', async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create school (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, logo, address, city, county, phone, email, latitude, longitude } = req.body;

    const school = new School({
      name,
      logo: logo || '/uploads/default-school-logo.png',
      address,
      city,
      county,
      phone,
      email,
      latitude,
      longitude
    });

    await school.save();
    res.status(201).json({ message: 'School created successfully', school });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update school
router.put('/:id', async (req, res) => {
  try {
    const { name, logo, address, city, county, phone, email, latitude, longitude, status } = req.body;

    // Managers can only update their own school
    if (req.userRole === 'manager' && req.user.sid.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    if (name) school.name = name;
    if (logo) school.logo = logo;
    if (address !== undefined) school.address = address;
    if (city) school.city = city;
    if (county) school.county = county;
    if (phone) school.phone = phone;
    if (email) school.email = email;
    if (latitude !== undefined) school.latitude = latitude;
    if (longitude !== undefined) school.longitude = longitude;
    if (status && req.userRole === 'admin') school.status = status;
    school.updatedAt = Date.now();

    await school.save();
    res.json({ message: 'School updated successfully', school });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete/Suspend school (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { status: 'Suspended' },
      { new: true }
    );

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json({ message: 'School suspended successfully', school });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

