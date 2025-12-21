const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
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
  image: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String,
    enum: ['dashboard', 'report', 'staff', 'map', 'noticeboard', 'school', 'students', 'parents', 'driver', 'route', 'stops', 'send', 'receive']
  }],
  isStaff: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active'
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

managerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

managerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Manager', managerSchema);

