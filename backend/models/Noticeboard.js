const mongoose = require('mongoose');

const noticeboardSchema = new mongoose.Schema({
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'event', 'academic', 'transport', 'fee'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal'
  },
  attachments: [{
    type: String, // File paths or URLs
    trim: true
  }],
  readBy: [{
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isdelete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
noticeboardSchema.index({ sid: 1, isdelete: 1, createdAt: -1 });
noticeboardSchema.index({ studentId: 1 });
noticeboardSchema.index({ category: 1 });

module.exports = mongoose.model('Noticeboard', noticeboardSchema);

