const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: '/uploads/default-driver.png'
  },
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  deviceToken: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Deleted'],
    default: 'Active'
  },
  currentRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  journeyStatus: {
    type: String,
    enum: ['idle', 'active', 'completed'],
    default: 'idle'
  },
  journeyStartedAt: {
    type: Date
  },
  journeyType: {
    type: String,
    enum: ['pickup', 'drop-off']
  },
  currentJourneyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journey'
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

driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

driverSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);

