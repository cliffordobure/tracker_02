const mongoose = require('mongoose');

const driverRatingSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  comment: {
    type: String,
    maxlength: 500,
    trim: true
  },
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
driverRatingSchema.index({ driverId: 1, createdAt: -1 });
driverRatingSchema.index({ parentId: 1, createdAt: -1 });
driverRatingSchema.index({ studentId: 1, createdAt: -1 });
driverRatingSchema.index({ rating: 1, createdAt: -1 });
driverRatingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DriverRating', driverRatingSchema);


