const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  photo: {
    type: String,
    default: '/uploads/default-student.png'
  },
  grade: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  pickup: {
    type: String,
    default: ''
  },
  dropped: {
    type: String,
    default: ''
  },
  leftSchool: {
    type: String, // Timestamp when student left school (set by teacher)
    default: ''
  },
  leftSchoolBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff' // Teacher who marked student as leaving
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  status: {
    type: String,
    enum: ['Active', 'Missing', 'Leave'],
    default: 'Active'
  },
  isdelete: {
    type: Boolean,
    default: false
  },
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);

