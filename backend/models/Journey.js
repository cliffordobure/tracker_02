const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress',
    index: true
  },
  journeyType: {
    type: String,
    enum: ['pickup', 'drop-off'],
    required: true
  },
  startedAt: {
    type: Date,
    required: true,
    index: true
  },
  endedAt: {
    type: Date,
    index: true
  },
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    pickedUpAt: {
      type: Date
    },
    droppedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'dropped', 'skipped'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
journeySchema.index({ driverId: 1, startedAt: -1 });
journeySchema.index({ driverId: 1, status: 1, startedAt: -1 });
journeySchema.index({ routeId: 1, startedAt: -1 });

// Update the updatedAt field before saving
journeySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Journey', journeySchema);

