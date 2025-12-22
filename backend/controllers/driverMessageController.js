const Message = require('../models/Message');
const Driver = require('../models/Driver');
const Parent = require('../models/Parent');
const Manager = require('../models/Manager');
const Student = require('../models/Student');
const { getSocketIO } = require('../services/socketService');

/**
 * Get driver's inbox messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getInbox = async (req, res) => {
  try {
    console.log('📥 Driver getInbox called');
    
    const driverId = req.user._id;
    console.log('Driver ID:', driverId);
    
    // Validate driver ID
    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: 'Driver ID not found in token'
      });
    }
    
    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const { fromType = 'all', page = 1, limit = 20 } = req.query;
    console.log('Query params:', { fromType, page, limit });
    
    // Build query
    const query = {
      to: 'driver',
      toId: driverId,
      isdelete: false
    };
    
    // Filter by sender type if specified
    if (fromType && fromType !== 'all') {
      query.from = fromType;
    }
    
    console.log('Query:', JSON.stringify(query));
    
    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Fetch messages
    const messages = await Message.find(query)
      .populate('fromId', 'name email')
      .populate('toId', 'name email')
      .populate({
        path: 'studentId',
        select: 'name photo grade',
        match: { isdelete: { $ne: true } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      from: msg.from,
      fromName: msg.fromName || (msg.fromId?.name || 'Unknown'),
      fromId: msg.fromId?._id || msg.fromId,
      to: msg.to,
      toId: msg.toId?._id || msg.toId,
      subject: msg.subject,
      message: msg.message,
      isRead: msg.isRead,
      readAt: msg.readAt,
      studentId: msg.studentId ? {
        _id: msg.studentId._id,
        name: msg.studentId.name,
        photo: msg.studentId.photo,
        grade: msg.studentId.grade
      } : null,
      attachments: msg.attachments || [],
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));
    
    console.log(`✅ Found ${formattedMessages.length} messages for driver ${driverId}`);
    
    res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error('❌ Driver getInbox error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send message from driver to parent or manager
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  try {
    console.log('📤 Driver sendMessage called');
    
    const driverId = req.user._id;
    console.log('Driver ID:', driverId);
    
    // Validate driver ID
    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: 'Driver ID not found in token'
      });
    }
    
    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const { toId, toType, message, subject, studentId, attachments } = req.body;
    console.log('Request body:', { toId, toType, message: message?.substring(0, 50) + '...', subject, studentId });
    
    // Validate required fields
    if (!toId || !toType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID, type, and message are required'
      });
    }
    
    // Validate recipient type
    if (!['parent', 'manager'].includes(toType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient type. Must be parent or manager'
      });
    }
    
    // Verify recipient exists and belongs to same school
    let recipient;
    if (toType === 'parent') {
      recipient = await Parent.findById(toId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found'
        });
      }
      // Verify parent belongs to driver's school
      if (recipient.sid && recipient.sid.toString() !== driver.sid.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Parent does not belong to your school.'
        });
      }
      
      // If studentId is provided, verify student belongs to parent
      if (studentId) {
        const student = await Student.findById(studentId);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found'
          });
        }
        if (!student.parents || !student.parents.includes(toId)) {
          return res.status(403).json({
            success: false,
            message: 'Student does not belong to this parent'
          });
        }
      }
    } else if (toType === 'manager') {
      recipient = await Manager.findById(toId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }
      // Verify manager belongs to driver's school
      if (recipient.sid.toString() !== driver.sid.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Manager does not belong to your school.'
        });
      }
    }
    
    // Create message
    const newMessage = new Message({
      from: 'driver',
      fromId: driverId,
      fromName: driver.name,
      to: toType,
      toId: recipient._id,
      toName: recipient.name,
      studentId: studentId || null,
      subject: subject || `Message from ${driver.name}`,
      message,
      type: 'direct',
      attachments: attachments || []
    });
    
    await newMessage.save();
    console.log('✅ Message saved with ID:', newMessage._id);
    
    // Notify recipient via Socket.io
    const io = getSocketIO();
    const roomName = `${toType}:${recipient._id}`;
    io.to(roomName).emit('notification', {
      type: 'message',
      messageId: newMessage._id,
      from: driver.name,
      fromType: 'driver',
      subject: newMessage.subject,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Socket notification sent to room: ${roomName}`);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: newMessage._id,
        to: {
          id: recipient._id,
          name: recipient.name,
          type: toType
        },
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Driver sendMessage error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get specific message by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessage = async (req, res) => {
  try {
    const driverId = req.user._id;
    const messageId = req.params.id;
    
    const message = await Message.findById(messageId)
      .populate('fromId', 'name email')
      .populate('toId', 'name email')
      .populate({
        path: 'studentId',
        select: 'name photo grade',
        match: { isdelete: { $ne: true } }
      });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Verify message belongs to driver
    if (message.toId.toString() !== driverId.toString() && message.fromId.toString() !== driverId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Mark as read if driver is the recipient
    if (message.toId.toString() === driverId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }
    
    res.json({
      success: true,
      data: {
        _id: message._id,
        from: message.from,
        fromName: message.fromName || (message.fromId?.name || 'Unknown'),
        fromId: message.fromId?._id || message.fromId,
        subject: message.subject,
        message: message.message,
        isRead: message.isRead,
        readAt: message.readAt,
        studentId: message.studentId ? {
          _id: message.studentId._id,
          name: message.studentId.name,
          photo: message.studentId.photo,
          grade: message.studentId.grade
        } : null,
        attachments: message.attachments || [],
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Driver getMessage error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Mark message as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = async (req, res) => {
  try {
    const driverId = req.user._id;
    const messageId = req.params.id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Verify message belongs to driver
    if (message.toId.toString() !== driverId.toString() && message.fromId.toString() !== driverId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    res.json({
      success: true,
      message: 'Message marked as read',
      data: {
        _id: message._id,
        isRead: message.isRead,
        readAt: message.readAt
      }
    });
  } catch (error) {
    console.error('❌ Driver markAsRead error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Mark all messages as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAllAsRead = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    const result = await Message.updateMany(
      {
        to: 'driver',
        toId: driverId,
        isRead: false,
        isdelete: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: 'All messages marked as read',
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('❌ Driver markAllAsRead error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Reply to a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const replyToMessage = async (req, res) => {
  try {
    const driverId = req.user._id;
    const messageId = req.params.id;
    const { message: replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }
    
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }
    
    // Verify driver has access to this message
    if (originalMessage.toId.toString() !== driverId.toString() && originalMessage.fromId.toString() !== driverId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get driver info
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Get recipient info
    let recipient;
    if (originalMessage.from === 'parent') {
      recipient = await Parent.findById(originalMessage.fromId);
    } else if (originalMessage.from === 'manager') {
      recipient = await Manager.findById(originalMessage.fromId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cannot reply to this message type'
      });
    }
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }
    
    // Create reply
    const reply = new Message({
      from: 'driver',
      fromId: driverId,
      fromName: driver.name,
      to: originalMessage.from,
      toId: originalMessage.fromId,
      toName: recipient.name,
      subject: `Re: ${originalMessage.subject || 'Message'}`,
      message: replyText,
      type: 'direct',
      parentMessageId: originalMessage._id,
      studentId: originalMessage.studentId
    });
    
    await reply.save();
    
    // Mark original as read
    originalMessage.isRead = true;
    originalMessage.readAt = new Date();
    await originalMessage.save();
    
    // Notify recipient via Socket.io
    const io = getSocketIO();
    const roomName = `${originalMessage.from}:${originalMessage.fromId}`;
    io.to(roomName).emit('notification', {
      type: 'message',
      messageId: reply._id,
      from: driver.name,
      fromType: 'driver',
      subject: reply.subject,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        _id: reply._id,
        subject: reply.subject,
        message: reply.message,
        createdAt: reply.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Driver replyToMessage error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get outbox messages (messages sent by driver)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOutbox = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { toType = 'all', page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {
      from: 'driver',
      fromId: driverId,
      isdelete: false
    };
    
    // Filter by recipient type if specified
    if (toType && toType !== 'all') {
      query.to = toType;
    }
    
    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Fetch messages
    const messages = await Message.find(query)
      .populate('fromId', 'name email')
      .populate('toId', 'name email')
      .populate({
        path: 'studentId',
        select: 'name photo grade',
        match: { isdelete: { $ne: true } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      from: msg.from,
      fromName: msg.fromName || (msg.fromId?.name || 'Unknown'),
      fromId: msg.fromId?._id || msg.fromId,
      to: msg.to,
      toName: msg.toName || (msg.toId?.name || 'Unknown'),
      toId: msg.toId?._id || msg.toId,
      subject: msg.subject,
      message: msg.message,
      isRead: msg.isRead,
      studentId: msg.studentId ? {
        _id: msg.studentId._id,
        name: msg.studentId.name,
        photo: msg.studentId.photo,
        grade: msg.studentId.grade
      } : null,
      attachments: msg.attachments || [],
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));
    
    res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error('❌ Driver getOutbox error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getInbox,
  sendMessage,
  getMessage,
  markAsRead,
  markAllAsRead,
  replyToMessage,
  getOutbox
};

