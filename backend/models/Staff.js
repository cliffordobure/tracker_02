const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
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
  fid: {
    type: String,
    unique: true,
    sparse: true // Only index non-null values
  },
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  permissions: [{
    type: String,
    enum: ['dashboard', 'report', 'staff', 'map', 'noticeboard', 'school', 'students', 'parents', 'driver', 'route', 'stops', 'send', 'receive']
  }],
  role: {
    type: String,
    enum: ['staff', 'teacher'],
    default: 'staff'
  },
  assignedClass: {
    type: String, // e.g., 'PP1', 'PP2', 'Grade 1', etc.
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: '/uploads/default-teacher.png'
  },
  deviceToken: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active'
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

staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

staffSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Staff', staffSchema);

