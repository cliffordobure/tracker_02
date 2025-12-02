const mongoose = require('mongoose');

const driverRatingSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
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

// Index to prevent duplicate ratings from same parent for same driver
driverRatingSchema.index({ driverId: 1, parentId: 1 }, { unique: false });
driverRatingSchema.index({ driverId: 1, createdAt: -1 });

module.exports = mongoose.model('DriverRating', driverRatingSchema);


