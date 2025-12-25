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
    enum: [
      'pickup', 
      'drop', 
      'alert', 
      'notice', 
      'general', 
      'journey_started', 
      'journey_ended', 
      'student_picked_up', 
      'student_dropped',
      'student_on_leave',
      'student_missing',
      'student_active',
      'leave_request',
      'leave_request_approved',
      'leave_request_rejected'
    ],
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

