const Message = require('../models/Message');
const Parent = require('../models/Parent');
const Manager = require('../models/Manager');
const Student = require('../models/Student');
const { getSocketIO } = require('../services/socketService');

/**
 * Send message from parent to manager
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendToManager = async (req, res) => {
  try {
    console.log('📤 Parent sendToManager called');
    
    const parentId = req.user._id;
    console.log('Parent ID:', parentId);
    
    // Get parent with SID
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }
    
    console.log('Parent SID:', parent.sid);
    
    const { message, subject, studentId, attachments } = req.body;
    console.log('Request body:', { 
      message: message?.substring(0, 50) + '...', 
      subject, 
      studentId 
    });
    
    // Validate required fields
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Find manager for parent's school
    console.log(`🔍 Searching for manager with SID: ${parent.sid}`);
    const manager = await Manager.findOne({
      sid: parent.sid,
      status: 'Active',
      isDeleted: false
    });
    
    if (!manager) {
      console.log(`❌ Manager not found for SID: ${parent.sid}`);
      return res.status(404).json({
        success: false,
        message: 'Manager not found for your school'
      });
    }
    
    console.log(`✅ Manager found: ${manager._id} ${manager.name}`);
    
    // Validate student if provided
    if (studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      // Verify student belongs to parent
      if (!parent.students || !parent.students.includes(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Student does not belong to you'
        });
      }
    }
    
    // Create message
    const newMessage = new Message({
      from: 'parent',
      fromId: parentId,
      fromName: parent.name,
      to: 'manager',
      toId: manager._id,
      toName: manager.name,
      studentId: studentId || null,
      subject: subject || `Message from ${parent.name}`,
      message: message.trim(),
      type: 'direct',
      attachments: attachments || []
    });
    
    await newMessage.save();
    console.log('✅ Message saved with ID:', newMessage._id);
    
    // Notify manager via Socket.io
    const io = getSocketIO();
    const roomName = `manager:${manager._id}`;
    io.to(roomName).emit('notification', {
      type: 'message',
      messageId: newMessage._id,
      from: parent.name,
      fromType: 'parent',
      subject: newMessage.subject,
      studentId: studentId || null,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Socket notification sent to room: ${roomName}`);
    
    res.status(201).json({
      success: true,
      message: 'Message sent to manager successfully',
      data: {
        id: newMessage._id,
        to: {
          id: manager._id,
          name: manager.name,
          type: 'manager'
        },
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Parent sendToManager error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  sendToManager
};

