const Message = require('../models/Message');
const Parent = require('../models/Parent');
const Manager = require('../models/Manager');
const Student = require('../models/Student');
const { getSocketIO } = require('../services/socketService');
const { sendToDevice } = require('../services/firebaseService');

/**
 * Send message from parent to manager
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendToManager = async (req, res) => {
  try {
    console.log('📤 Parent sendToManager called');
    
    // Verify parent authentication
    if (!req.user || !req.user._id) {
      console.log('❌ Parent authentication failed - no user in request');
      return res.status(401).json({
        success: false,
        message: 'Parent authentication required. Please log in again.'
      });
    }
    
    const parentId = req.user._id;
    console.log('Parent ID:', parentId);
    console.log('Parent Role:', req.userRole || 'parent');
    
    // Get parent with SID
    const parent = await Parent.findById(parentId);
    if (!parent) {
      console.log(`❌ Parent not found in database with ID: ${parentId}`);
      return res.status(404).json({
        success: false,
        message: 'Parent not found in system. Please contact administrator.'
      });
    }
    
    console.log('✅ Parent authenticated successfully:', { 
      id: parent._id, 
      name: parent.name, 
      sid: parent.sid,
      status: parent.status || 'Active'
    });
    
    // Check parent status
    if (parent.status && parent.status !== 'Active') {
      console.log(`❌ Parent is inactive: { id: ${parent._id}, status: ${parent.status} }`);
      return res.status(403).json({
        success: false,
        message: `Parent account is ${parent.status}. Please contact administrator to activate your account.`
      });
    }
    
    const { message, subject, studentId, attachments } = req.body;
    console.log('Request body:', { 
      message: message ? (message.length > 50 ? message.substring(0, 50) + '...' : message) : null, 
      subject, 
      studentId,
      attachments: attachments ? `${attachments.length} attachment(s)` : 'none'
    });
    
    // Validate required fields
    if (!message || message.trim() === '') {
      console.log('❌ Validation failed: Message is required');
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
        message: 'Manager not found for your school. Please contact administrator.'
      });
    }
    
    console.log(`✅ Manager found:`, { 
      id: manager._id, 
      name: manager.name, 
      sid: manager.sid,
      status: manager.status 
    });
    
    // Verify school match
    console.log(`🔍 Verifying school match:`, { 
      parentSid: parent.sid?.toString(), 
      managerSid: manager.sid?.toString(), 
      match: parent.sid?.toString() === manager.sid?.toString() 
    });
    
    if (parent.sid && manager.sid && parent.sid.toString() !== manager.sid.toString()) {
      console.log(`❌ School mismatch: Parent SID ${parent.sid} !== Manager SID ${manager.sid}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager does not belong to your school.'
      });
    }
    
    console.log('✅ School verification passed');
    
    // Validate student if provided
    if (studentId) {
      console.log(`🔍 Validating student: ${studentId}`);
      const student = await Student.findById(studentId);
      if (!student) {
        console.log(`❌ Student not found: ${studentId}`);
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      // Verify student belongs to parent
      if (!parent.students || !parent.students.includes(studentId)) {
        console.log(`❌ Student ${studentId} does not belong to parent ${parentId}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Student does not belong to you.'
        });
      }
      
      console.log(`✅ Student validation passed: ${student.name}`);
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
    
    // Send FCM notification to manager if device token exists
    if (manager.deviceToken && manager.deviceToken.trim() !== '') {
      try {
        const student = studentId ? await Student.findById(studentId) : null;
        const notificationMessage = `💬 New message from ${parent.name}${student ? ` about ${student.name}` : ''}`;
        
        await sendToDevice(
          manager.deviceToken,
          notificationMessage,
          {
            type: 'message',
            messageId: newMessage._id.toString(),
            fromId: parent._id.toString(),
            fromName: parent.name,
            fromType: 'parent',
            subject: newMessage.subject,
            studentId: studentId || null
          },
          '💬 New Message'
        );
        console.log(`✅ FCM notification sent to manager: ${manager._id}`);
      } catch (fcmError) {
        console.error('❌ Error sending FCM notification to manager:', fcmError);
        // Don't fail the request if FCM fails
      }
    } else {
      console.log(`ℹ️ Manager ${manager._id} has no device token, skipping FCM notification`);
    }
    
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

