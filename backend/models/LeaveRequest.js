const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
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

// Compound indexes for efficient queries
// Index for queries by student and status (as per documentation)
leaveRequestSchema.index({ studentId: 1, status: 1 });
// Index for parent's leave history
leaveRequestSchema.index({ parentId: 1, createdAt: -1 });
// Index for date range queries
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

// Update the updatedAt field before saving
leaveRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

