const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

router.use(authenticate);

// Get all students
router.get('/', async (req, res) => {
  try {
    let students;
    const { status } = req.query;

    let query = { isdelete: false };
    
    if (req.userRole === 'manager') {
      query.sid = req.user.sid;
    } else if (req.userRole === 'parent') {
      query._id = { $in: req.user.students };
    }

    if (status) {
      query.status = status;
    }

    students = await Student.find(query)
      .populate('sid', 'name')
      .populate('route', 'name')
      .populate('parents', 'name email')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('sid', 'name')
      .populate('route', 'name')
      .populate('parents', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access
    if (req.userRole === 'manager' && student.sid._id.toString() !== req.user.sid.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, photo, grade, address, latitude, longitude, route, parents } = req.body;

    const student = new Student({
      name,
      sid: req.user.sid,
      photo: photo || '/uploads/default-student.png',
      grade,
      address,
      latitude,
      longitude,
      route,
      parents: parents || []
    });

    await student.save();

    // Update parent's student list
    if (parents && parents.length > 0) {
      await Parent.updateMany(
        { _id: { $in: parents } },
        { $addToSet: { students: student._id } }
      );
    }

    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { name, photo, grade, address, latitude, longitude, route, status, pickup, dropped, parents } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access
    if (req.userRole === 'manager' && student.sid.toString() !== req.user.sid.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Store old parents before updating
    const oldParentIds = student.parents ? student.parents.map(p => p.toString()) : [];

    if (name) student.name = name;
    if (photo) student.photo = photo;
    if (grade) student.grade = grade;
    if (address !== undefined) student.address = address;
    if (latitude !== undefined) student.latitude = latitude;
    if (longitude !== undefined) student.longitude = longitude;
    if (route) student.route = route;
    if (status) student.status = status;
    if (pickup !== undefined) student.pickup = pickup;
    if (dropped !== undefined) student.dropped = dropped;
    
    // Handle parents assignment
    if (parents !== undefined) {
      // Convert to array and normalize parent IDs
      const newParentIds = Array.isArray(parents) 
        ? parents.filter(p => p) // Remove null/undefined
          .map(p => {
            // Handle both string and ObjectId formats
            return typeof p === 'string' ? p : (p._id ? p._id.toString() : p.toString());
          })
        : [];
      
      // Convert to ObjectIds for storage
      student.parents = newParentIds.map(id => new mongoose.Types.ObjectId(id));

      // Find parents that were removed
      const removedParentIds = oldParentIds.filter(pId => !newParentIds.includes(pId));
      
      // Find parents that were added
      const addedParentIds = newParentIds.filter(pId => !oldParentIds.includes(pId));

      // Remove student from parents that were unassigned
      if (removedParentIds.length > 0) {
        await Parent.updateMany(
          { _id: { $in: removedParentIds } },
          { $pull: { students: student._id } }
        );
      }

      // Add student to newly assigned parents
      if (addedParentIds.length > 0) {
        await Parent.updateMany(
          { _id: { $in: addedParentIds } },
          { $addToSet: { students: student._id } }
        );
      }
    }

    student.updatedAt = Date.now();
    await student.save();

    // Populate parents for response
    await student.populate('parents', 'name email');
    
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete student (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    if (req.userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isdelete: true },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

