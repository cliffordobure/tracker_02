const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    enum: ['parent', 'driver', 'manager', 'staff', 'admin'],
    required: true
  },
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  fromName: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    enum: ['parent', 'driver', 'manager', 'staff', 'admin'],
    required: true
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['direct', 'announcement', 'notification'],
    default: 'direct'
  },
  attachments: [{
    type: String, // File paths or URLs
    trim: true
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message' // For reply threading
  },
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
messageSchema.index({ toId: 1, to: 1, isdelete: 1, createdAt: -1 });
messageSchema.index({ fromId: 1, from: 1 });
messageSchema.index({ studentId: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ parentMessageId: 1 });

module.exports = mongoose.model('Message', messageSchema);


