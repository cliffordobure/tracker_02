const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  pid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    default: null
  },
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pickup', 'drop', 'alert', 'notice', 'general', 'journey_started', 'student_picked_up', 'student_dropped'],
    default: 'general'
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);

