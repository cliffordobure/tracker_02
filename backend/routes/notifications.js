const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.use(authenticate);

// Get all notifications
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    if (req.userRole === 'parent') {
      query.pid = req.user._id;
    } else if (req.userRole === 'manager') {
      query.sid = req.user.sid;
    }

    const notifications = await Notification.find(query)
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

