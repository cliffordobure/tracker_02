const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  teacherName: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  attachments: [{
    type: String, // File paths or URLs
    trim: true
  }],
  parentSignature: {
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent'
    },
    signedAt: {
      type: Date
    },
    signature: {
      type: String // Base64 encoded signature image or text
    }
  },
  teacherNote: {
    type: String,
    default: null,
    trim: true,
    maxlength: 500 // Limit to 500 characters
  },
  teacherNoteVisible: {
    type: Boolean,
    default: false // Only true after parent signs
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
diarySchema.index({ studentId: 1, date: -1 });
diarySchema.index({ isdelete: 1 });

module.exports = mongoose.model('Diary', diarySchema);


