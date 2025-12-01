const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  from: {
    type: String,
    enum: ['parent', 'driver', 'manager'],
    required: true
  },
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  to: {
    type: String,
    enum: ['parent', 'driver', 'manager'],
    required: true
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', contactSchema);

