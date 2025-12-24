# Parent-to-Manager Messaging Backend Documentation

This document describes the backend implementation for parent-to-manager messaging functionality.

---

## 📋 Overview

The backend fully supports parent-to-manager messaging through a dedicated endpoint. Parents can send messages to their school's manager without needing to select a specific manager ID - the backend automatically finds the correct manager based on the parent's school ID (`sid`).

---

## 🔌 API Endpoint

### Send Message to Manager

**Endpoint:** `POST /api/parent/messages/manager`

**Authentication:** Required (Parent JWT token via `authenticate` middleware)

**Route Location:** `backend/routes/parent.js` (line 1399)

**Controller:** `backend/controllers/parentMessageController.js` - `sendToManager()` function

---

## 📥 Request Format

### Headers

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Request Body

```json
{
  "message": "Your message text here (required)",
  "subject": "Optional subject line",
  "studentId": "optional_student_id",
  "attachments": ["url1", "url2"]  // optional array of attachment URLs
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | String | ✅ Yes | The message content |
| `subject` | String | ❌ No | Optional subject line (defaults to "Message from {parent.name}") |
| `studentId` | String/ObjectId | ❌ No | Optional student ID to associate with the message |
| `attachments` | Array[String] | ❌ No | Optional array of attachment URLs |

---

## 📤 Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Message sent to manager successfully",
  "data": {
    "id": "message_id",
    "to": {
      "id": "manager_id",
      "name": "Manager Name",
      "type": "manager"
    },
    "subject": "Message subject",
    "message": "Message content",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Parent authentication required. Please log in again."
}
```

#### 400 Bad Request - Missing Message

```json
{
  "success": false,
  "message": "Message is required"
}
```

#### 403 Forbidden - Inactive Parent

```json
{
  "success": false,
  "message": "Parent account is {status}. Please contact administrator to activate your account."
}
```

#### 403 Forbidden - Student Access Denied

```json
{
  "success": false,
  "message": "Access denied. Student does not belong to you."
}
```

#### 404 Not Found - Manager Not Found

```json
{
  "success": false,
  "message": "Manager not found for your school. Please contact administrator to assign a manager to your school."
}
```

#### 404 Not Found - Student Not Found

```json
{
  "success": false,
  "message": "Student not found"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Server error",
  "error": "Error message details"
}
```

---

## 🔧 Implementation Details

### 1. Manager Lookup Process

The backend automatically finds the manager for the parent's school using the following logic:

1. **Primary Lookup:** Finds manager where:
   - `sid` matches parent's `sid`
   - `status` is `'Active'`
   - `isDeleted` is `false`

2. **Fallback Lookup (if no active manager):** Finds manager where:
   - `sid` matches parent's `sid`
   - `isDeleted` is `false`
   - (Status can be `'Active'` or `'Suspended'`)

3. **Debug Fallback (if still not found):** Tries to find any manager with matching `sid` (for debugging purposes)

**Code Location:** `backend/controllers/parentMessageController.js` (lines 122-152)

### 2. Message Creation

Messages are created using the `Message` model with the following structure:

```javascript
{
  from: 'parent',
  fromId: parentId,           // From JWT token
  fromName: parent.name,
  to: 'manager',
  toId: manager._id,          // Found automatically via SID lookup
  toName: manager.name,
  studentId: studentId || null,
  subject: subject || `Message from ${parent.name}`,
  message: message.trim(),
  type: 'direct',
  attachments: attachments || []
}
```

**Code Location:** `backend/controllers/parentMessageController.js` (lines 217-229)

### 3. Real-time Notifications

#### Socket.io Notification

Sends real-time notification to manager via Socket.io:

```javascript
io.to(`manager:${manager._id}`).emit('notification', {
  type: 'message',
  messageId: newMessage._id,
  from: parent.name,
  fromType: 'parent',
  subject: newMessage.subject,
  studentId: studentId || null,
  timestamp: new Date().toISOString()
});
```

**Code Location:** `backend/controllers/parentMessageController.js` (lines 235-246)

#### FCM Push Notification

Sends push notification to manager's device if `deviceToken` exists:

```javascript
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
```

**Code Location:** `backend/controllers/parentMessageController.js` (lines 249-275)

---

## 🔐 Security & Validation

### Authentication

- ✅ Parent authentication required via JWT token
- ✅ Parent must exist in database
- ✅ Parent status checked (must be 'Active' if status field exists)

### Authorization

- ✅ Manager must belong to parent's school (`sid` match)
- ✅ If `studentId` provided, student must belong to parent
- ✅ Student validation ensures parent has access to the student

### Input Validation

- ✅ `message` field is required and cannot be empty
- ✅ `studentId` validated if provided (must exist and belong to parent)
- ✅ `subject` is optional (defaults if not provided)
- ✅ `attachments` validated as array if provided

**Code Location:** `backend/controllers/parentMessageController.js` (lines 14-214)

---

## 📊 Database Models

### Message Model

The message is stored in the `Message` collection with the following relevant fields:

- `from`: `'parent'`
- `fromId`: Parent ObjectId
- `fromName`: Parent name
- `to`: `'manager'`
- `toId`: Manager ObjectId
- `toName`: Manager name
- `studentId`: Optional student ObjectId
- `subject`: Message subject
- `message`: Message content
- `type`: `'direct'`
- `attachments`: Array of attachment URLs
- `createdAt`: Timestamp

**Model Location:** `backend/models/Message.js`

### Manager Model

The manager lookup uses the following fields:

- `_id`: Manager ObjectId
- `name`: Manager name
- `email`: Manager email
- `sid`: School ObjectId (used for matching)
- `status`: `'Active'` or `'Suspended'`
- `isDeleted`: Boolean flag
- `deviceToken`: FCM device token (for push notifications)

**Model Location:** `backend/models/Manager.js`

### Parent Model

The parent lookup uses the following fields:

- `_id`: Parent ObjectId
- `name`: Parent name
- `sid`: School ObjectId (used for manager lookup)
- `students`: Array of student ObjectIds (for validation)
- `status`: Optional status field

**Model Location:** `backend/models/Parent.js`

---

## 🔄 Related Endpoints

### Get Manager Information

**Endpoint:** `GET /api/parent/manager`

**Purpose:** Get manager information for parent's school

**Location:** `backend/routes/parent.js` (line 1173)

**Response:** Returns manager details (name, email, phone, photo, etc.)

---

## 🧪 Testing

### Manual Testing

1. **Test successful message send:**
   ```bash
   curl -X POST http://localhost:5000/api/parent/messages/manager \
     -H "Authorization: Bearer {parent_jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Test message to manager",
       "subject": "Test Subject",
       "studentId": "optional_student_id"
     }'
   ```

2. **Test missing message:**
   ```bash
   curl -X POST http://localhost:5000/api/parent/messages/manager \
     -H "Authorization: Bearer {parent_jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. **Test invalid student:**
   ```bash
   curl -X POST http://localhost:5000/api/parent/messages/manager \
     -H "Authorization: Bearer {parent_jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Test message",
       "studentId": "invalid_student_id"
     }'
   ```

### Expected Behavior

- ✅ Message saved to database
- ✅ Socket.io notification sent to manager room
- ✅ FCM push notification sent (if manager has deviceToken)
- ✅ Returns 201 with message data on success
- ✅ Returns appropriate error codes for validation failures
- ✅ Manager found automatically based on parent's school ID

---

## 📝 Logging

The implementation includes comprehensive logging for debugging:

- ✅ Parent authentication status
- ✅ Manager lookup process and results
- ✅ Student validation results
- ✅ Message creation confirmation
- ✅ Notification sending status
- ✅ Error logging with stack traces

**Code Location:** `backend/controllers/parentMessageController.js` (throughout)

---

## 🔗 Route Registration

The route is registered in `backend/routes/parent.js`:

```javascript
const { sendToManager } = require('../controllers/parentMessageController');

// ... other routes ...

// Send message to manager
router.post('/messages/manager', sendToManager);
```

**Important:** This route must be defined **before** parameterized routes like `/messages/:messageId` to ensure proper route matching. Express matches routes in order, so `/messages/:id` would match `/messages/manager` if defined first.

**Code Location:** `backend/routes/parent.js` (lines 1168, 1399)

---

## 📚 Related Files

### Core Implementation Files

- `backend/routes/parent.js` - Route registration (line 1399)
- `backend/controllers/parentMessageController.js` - Controller implementation
- `backend/models/Message.js` - Message model
- `backend/models/Manager.js` - Manager model
- `backend/models/Parent.js` - Parent model

### Supporting Files

- `backend/services/socketService.js` - Socket.io service for real-time notifications
- `backend/services/firebaseService.js` - FCM push notification service
- `backend/middleware/auth.js` - Authentication middleware

---

## ✅ Status

**Implementation Status:** ✅ **Complete and Production Ready**

- ✅ Endpoint implemented and tested
- ✅ Authentication and authorization working
- ✅ Manager lookup logic implemented
- ✅ Real-time notifications (Socket.io) working
- ✅ Push notifications (FCM) working
- ✅ Error handling comprehensive
- ✅ Logging implemented
- ✅ Route order correct (before parameterized routes)

---

## 🔄 Future Enhancements (Optional)

1. **Multiple Managers Support:**
   - Currently assumes one manager per school
   - Could be enhanced to support multiple managers per school
   - Frontend would need to show manager dropdown if multiple exist

2. **Message Threading:**
   - Currently each message is independent
   - Could add thread/conversation grouping
   - Would require database schema changes

3. **Message Status:**
   - Could add read receipts
   - Could add delivery confirmation
   - Would require additional fields in Message model

4. **Rich Attachments:**
   - Currently supports URL-based attachments
   - Could add file upload support
   - Would require file storage integration

---

## 📞 Support

For issues or questions about this implementation:

1. Check logs in `backend/controllers/parentMessageController.js` (comprehensive logging)
2. Verify manager exists for parent's school (`sid` match)
3. Verify parent authentication token is valid
4. Check Socket.io and FCM service status if notifications not working

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

