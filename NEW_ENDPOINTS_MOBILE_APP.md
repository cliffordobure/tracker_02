# New Endpoints for Mobile App Integration

This document lists all new endpoints and updates added during the recent development session that mobile apps may need to integrate.

---

## 📋 Summary of Changes

### New Endpoints Added:
1. **Admin Messaging Endpoints** (4 new endpoints)
2. **Manager Messaging Endpoints** (5 new endpoints)
3. **Manager Parent Management** (2 new endpoints)
4. **Manager Helper Endpoints** (3 new endpoints for message composition)
5. **Updated Response Fields** (Driver speed, Teacher multiple classes, Student photos)

### Updated Features:
- Body parser limit increased to 10MB for image uploads
- Driver location updates now include speed calculation
- Teacher model supports multiple assigned classes

---

## 🔐 Admin Endpoints (New)

### 1. Get Inbox Messages
**Endpoint:** `GET /api/admin/messages/inbox`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `fromType` (optional): Filter by sender type - `'parent'`, `'driver'`, or `'all'` (default)

**Response (200 OK):**
```json
[
  {
    "_id": "message_id",
    "from": "parent",
    "fromId": "parent_id",
    "fromName": "John Parent",
    "to": "admin",
    "toId": "admin_id",
    "toName": "Admin Name",
    "subject": "Message Subject",
    "message": "Message content here",
    "type": "direct",
    "isRead": false,
    "readAt": null,
    "studentId": "student_id",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `500` - Server error

---

### 2. Get Outbox Messages
**Endpoint:** `GET /api/admin/messages/outbox`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `toType` (optional): Filter by recipient type - `'parent'`, `'driver'`, or `'all'` (default)

**Response (200 OK):**
```json
[
  {
    "_id": "message_id",
    "from": "admin",
    "fromId": "admin_id",
    "fromName": "Admin Name",
    "to": "parent",
    "toId": "parent_id",
    "toName": "John Parent",
    "subject": "Re: Message Subject",
    "message": "Reply message here",
    "type": "direct",
    "isRead": false,
    "parentMessageId": "original_message_id",
    "studentId": "student_id",
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
]
```

---

### 3. Mark Message as Read
**Endpoint:** `PUT /api/admin/messages/:id/read`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "Message marked as read",
  "data": {
    "_id": "message_id",
    "isRead": true,
    "readAt": "2024-01-15T11:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Message not found
- `500` - Server error

---

### 4. Reply to Message
**Endpoint:** `POST /api/admin/messages/:id/reply`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Reply text here"
}
```

**Response (201 Created):**
```json
{
  "message": "Reply sent successfully",
  "data": {
    "_id": "reply_message_id",
    "from": "admin",
    "fromId": "admin_id",
    "fromName": "Admin Name",
    "to": "parent",
    "toId": "parent_id",
    "toName": "John Parent",
    "subject": "Re: Original Subject",
    "message": "Reply text here",
    "parentMessageId": "original_message_id",
    "createdAt": "2024-01-15T11:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Reply message is required
- `404` - Original message not found
- `500` - Server error

---

## 👥 Manager Endpoints (New)

### 5. Get Inbox Messages
**Endpoint:** `GET /api/manager/messages/inbox`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `fromType` (optional): Filter by sender type - `'parent'`, `'driver'`, or `'all'` (default)

**Response (200 OK):**
```json
[
  {
    "_id": "message_id",
    "from": "parent",
    "fromId": "parent_id",
    "fromName": "John Parent",
    "to": "manager",
    "toId": "manager_id",
    "subject": "Message Subject",
    "message": "Message content",
    "isRead": false,
    "studentId": "student_id",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 6. Get Outbox Messages
**Endpoint:** `GET /api/manager/messages/outbox`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `toType` (optional): Filter by recipient type - `'parent'`, `'driver'`, or `'all'` (default)

**Response (200 OK):**
```json
[
  {
    "_id": "message_id",
    "from": "manager",
    "fromId": "manager_id",
    "fromName": "Manager Name",
    "to": "parent",
    "toId": "parent_id",
    "toName": "John Parent",
    "subject": "Message Subject",
    "message": "Message content",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 7. Mark Message as Read (Manager)
**Endpoint:** `PUT /api/manager/messages/:id/read`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response (200 OK):**
```json
{
  "message": "Message marked as read",
  "data": {
    "_id": "message_id",
    "isRead": true,
    "readAt": "2024-01-15T11:30:00.000Z"
  }
}
```

---

### 8. Reply to Message (Manager)
**Endpoint:** `POST /api/manager/messages/:id/reply`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Reply text here"
}
```

**Response (201 Created):**
```json
{
  "message": "Reply sent successfully",
  "data": {
    "_id": "reply_message_id",
    "from": "manager",
    "to": "parent",
    "subject": "Re: Original Subject",
    "message": "Reply text here",
    "createdAt": "2024-01-15T11:30:00.000Z"
  }
}
```

---

### 9. Send Message (Manager)
**Endpoint:** `POST /api/manager/messages`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "toId": "parent_id_or_driver_id",
  "toType": "parent", // or "driver"
  "studentId": "student_id", // optional
  "subject": "Message Subject", // optional
  "message": "Message content",
  "attachments": [] // optional
}
```

**Response (201 Created):**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "message_id",
    "to": {
      "id": "recipient_id",
      "name": "Recipient Name",
      "type": "parent"
    },
    "subject": "Message Subject",
    "message": "Message content",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid recipient type
- `403` - Access denied (recipient doesn't belong to manager's school)
- `404` - Recipient not found
- `500` - Server error

---

### 10. Update Parent
**Endpoint:** `PUT /api/manager/parents/:id`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Parent Name",
  "email": "updated@email.com",
  "phone": "+1234567890",
  "photo": "base64_encoded_image_or_url",
  "password": "new_password" // optional, only if changing password
}
```

**Response (200 OK):**
```json
{
  "message": "Parent updated successfully",
  "parent": {
    "_id": "parent_id",
    "name": "Updated Parent Name",
    "email": "updated@email.com",
    "phone": "+1234567890",
    "photo": "/uploads/parent-photo.jpg",
    "sid": "school_id",
    "status": "Active",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Email already exists
- `403` - Access denied (parent doesn't belong to manager's school)
- `404` - Parent not found
- `500` - Server error

---

### 11. Delete Parent
**Endpoint:** `DELETE /api/manager/parents/:id`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response (200 OK):**
```json
{
  "message": "Parent deleted successfully"
}
```

**Error Responses:**
- `403` - Access denied (parent doesn't belong to manager's school)
- `404` - Parent not found
- `500` - Server error

---

### 12. Get Parents List (For Message Composition)
**Endpoint:** `GET /api/manager/parents`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Description:** Get list of all parents in manager's school. Useful for populating recipient dropdown when composing messages.

**Response (200 OK):**
```json
[
  {
    "_id": "parent_id",
    "name": "John Parent",
    "email": "parent@example.com",
    "phone": "+1234567890",
    "photo": "/uploads/parent-photo.jpg",
    "status": "Active",
    "students": [
      {
        "_id": "student_id",
        "name": "Student Name"
      }
    ],
    "sid": "school_id",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Note:** Parents are filtered to only include those belonging to the manager's school.

---

### 13. Get Drivers List (For Message Composition)
**Endpoint:** `GET /api/manager/drivers`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Description:** Get list of all drivers in manager's school. Useful for populating recipient dropdown when composing messages.

**Response (200 OK):**
```json
[
  {
    "_id": "driver_id",
    "name": "John Driver",
    "email": "driver@example.com",
    "phone": "+1234567890",
    "vehicleNumber": "BUS123",
    "photo": "/uploads/driver-photo.jpg",
    "status": "Active",
    "sid": "school_id",
    "currentRoute": {
      "_id": "route_id",
      "name": "Route 1"
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Note:** Drivers are filtered to only include those belonging to the manager's school.

---

### 14. Get Students List (For Message Composition)
**Endpoint:** `GET /api/students` (with manager token)

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Description:** Get list of all students in manager's school. Useful for selecting related student when composing messages to parents.

**Response (200 OK):**
```json
[
  {
    "_id": "student_id",
    "name": "John Student",
    "photo": "/uploads/student-photo.jpg",
    "grade": "PP1",
    "address": "123 Main St",
    "status": "Active",
    "route": {
      "_id": "route_id",
      "name": "Route 1"
    },
    "parents": [
      {
        "_id": "parent_id",
        "name": "Parent Name",
        "email": "parent@example.com"
      }
    ],
    "sid": "school_id",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Note:** Students are automatically filtered by manager's school ID.

---

## 🔄 Updated Response Fields

### Driver Location Update (Enhanced)
**Endpoint:** `POST /api/driver/location` (existing endpoint, now includes speed)

**Response now includes:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "speed": 45.5, // NEW: Speed in km/h
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

**Socket.io Event:** `location-update` now includes speed:
```json
{
  "driverId": "driver_id",
  "driverName": "John Driver",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "speed": 45.5, // NEW: Real-time speed in km/h
  "routeId": "route_id",
  "routeName": "Route 1",
  "vehicleNumber": "BUS123",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### Teacher Profile (Multiple Classes Support)
**Endpoint:** `GET /api/teacher/profile` (existing endpoint, now includes assignedClasses)

**Response now includes:**
```json
{
  "success": true,
  "user": {
    "id": "teacher_id",
    "name": "John Teacher",
    "assignedClass": "PP1", // Kept for backward compatibility
    "assignedClasses": ["PP1", "PP2", "Grade 1"], // NEW: Array of assigned classes
    "role": "teacher",
    "sid": "school_id"
  }
}
```

**Note:** Mobile apps should check for `assignedClasses` array first, and fall back to `assignedClass` if array is empty or doesn't exist.

---

### Student Model (Photo Support)
**Endpoints:** All student endpoints now support photo field

**Student Object now includes:**
```json
{
  "id": "student_id",
  "name": "John Student",
  "photo": "/uploads/student-photo.jpg", // NEW: Photo URL or base64 data URL
  "grade": "PP1",
  "status": "Active"
}
```

**When creating/updating students:**
- `photo` field accepts base64 data URL (e.g., `data:image/jpeg;base64,...`)
- Maximum recommended size: 5MB before compression
- Images are automatically compressed on frontend before sending

---

## 📸 Image Upload Guidelines

### For Mobile Apps:

1. **Image Size Limit:**
   - Maximum file size: 5MB (before compression)
   - Recommended: Compress images before sending

2. **Supported Formats:**
   - JPEG, PNG, WebP
   - Convert to JPEG for best compression

3. **Base64 Encoding:**
   - Send images as base64 data URLs
   - Format: `data:image/jpeg;base64,<base64_string>`

4. **Compression Recommendations:**
   - Resize images to max 800x800px
   - Use JPEG quality 0.8 (80%)
   - This typically reduces file size by 70-90%

5. **Body Parser Limit:**
   - Backend now accepts up to 10MB payloads
   - Still recommended to compress on client side

---

## 🚀 Driver Speed Calculation

### How Speed is Calculated:
- Speed is automatically calculated when driver updates location
- Uses Haversine formula to calculate distance between consecutive locations
- Speed = (distance / time) * 3600 (converted to km/h)
- Maximum speed capped at 120 km/h
- Speed is stored in driver document and included in location updates

### Speed Values:
- `0` or `null` - Driver is stationary or no previous location
- `1-30` km/h - Slow speed (green indicator)
- `31-60` km/h - Medium speed (yellow indicator)
- `>60` km/h - High speed (red indicator)

---

## 📝 Notes for Mobile App Developers

### Breaking Changes:
- **None** - All changes are backward compatible

### New Optional Fields:
- Driver: `speed`, `previousLatitude`, `previousLongitude`, `lastLocationUpdate`
- Teacher: `assignedClasses` (array)
- Student: `photo` (string)
- Message: `from` and `to` now support `'admin'` and `'manager'` as values

### Manager Messaging Implementation Tips:

1. **Message Composition Flow:**
   - First, fetch parents/drivers list using helper endpoints
   - When parent is selected, fetch students to show related students
   - Filter students by checking if they belong to selected parent
   - Send message with optional `studentId` if related to specific student

2. **Real-time Updates:**
   - Use Socket.io to listen for new messages
   - Room name format: `manager:{manager_id}`
   - Event name: `notification` with type `'message'`

3. **Message Filtering:**
   - Use `fromType` query param for inbox filtering
   - Use `toType` query param for outbox filtering
   - Filter options: `'parent'`, `'driver'`, or `'all'`

4. **Unread Count:**
   - Count messages where `isRead === false`
   - Update count when marking messages as read
   - Refresh count periodically or on socket events

### Migration Notes:
1. **Teacher Multiple Classes:**
   - Check for `assignedClasses` array first
   - Fall back to `assignedClass` if array is empty/null
   - Display all classes if multiple assigned

2. **Student Photos:**
   - Always check if `photo` field exists
   - Handle both URL paths and base64 data URLs
   - Display default avatar if photo is missing

3. **Driver Speed:**
   - Speed may be `0` or `null` initially
   - Only updates when driver moves
   - Display speed with appropriate color coding

4. **Image Uploads:**
   - Compress images before sending
   - Use base64 encoding
   - Handle upload errors gracefully

---

## ✅ Testing Checklist

### Admin Messaging:
- [ ] Get inbox messages (all types)
- [ ] Get inbox messages (filtered by type)
- [ ] Get outbox messages
- [ ] Mark message as read
- [ ] Reply to message

### Manager Messaging:
- [ ] Get inbox messages (all types)
- [ ] Get inbox messages (filtered by type)
- [ ] Get outbox messages
- [ ] Mark message as read
- [ ] Reply to message
- [ ] Send new message to parent
- [ ] Send new message to driver
- [ ] Get parents list for message composition
- [ ] Get drivers list for message composition
- [ ] Get students list for message composition
- [ ] Socket.io connection and room joining
- [ ] Real-time message notifications

### Manager Parent Management:
- [ ] Update parent information
- [ ] Update parent with photo
- [ ] Delete parent
- [ ] Verify access control (only manager's school parents)

### Driver Speed:
- [ ] Verify speed appears in location updates
- [ ] Test speed calculation accuracy
- [ ] Display speed with color coding

### Student Photos:
- [ ] Upload student photo
- [ ] Display student photo in lists
- [ ] Handle missing photos gracefully

### Teacher Multiple Classes:
- [ ] Display multiple assigned classes
- [ ] Handle backward compatibility (single class)

---

## 🔌 Real-time Messaging (Socket.io)

### Manager Socket.io Integration

Managers can receive real-time message notifications via Socket.io:

**Join Manager Room:**
```javascript
socket.emit('join-manager-room', { managerId: 'manager_id' });
```

**Listen for New Messages:**
```javascript
socket.on('notification', (data) => {
  if (data.type === 'message') {
    // Handle new message notification
    console.log('New message from:', data.from);
    console.log('Message ID:', data.messageId);
    console.log('Subject:', data.subject);
  }
});
```

**Notification Event Structure:**
```json
{
  "type": "message",
  "messageId": "message_id",
  "from": "Parent Name",
  "fromType": "parent", // or "driver"
  "subject": "Message Subject",
  "studentId": "student_id", // optional
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Room Names:**
- Manager room: `manager:{manager_id}` - For receiving messages
- Parent room: `parent:{parent_id}` - For sending messages to parents
- Driver room: `driver:{driver_id}` - For sending messages to drivers

**Note:** When a manager sends a message, the recipient (parent or driver) receives a Socket.io notification in their respective room.

---

## 📱 Mobile App Implementation Guide

### Manager Messaging Flow:

1. **Initial Setup:**
   - Connect to Socket.io server
   - Join manager room: `socket.emit('join-manager-room', { managerId: user.id })`
   - Listen for `notification` events

2. **Fetching Messages:**
   - On app start, fetch inbox messages
   - Display unread count badge
   - Refresh messages periodically or on socket events

3. **Composing Messages:**
   - Fetch parents/drivers list first
   - When parent selected, fetch students to show related students
   - Filter students by checking if they belong to selected parent
   - Send message with optional `studentId`

4. **Real-time Updates:**
   - When new message received via socket, refresh inbox
   - Update unread count
   - Show notification badge

5. **Message Actions:**
   - Mark as read when message is opened
   - Reply directly from message detail
   - Filter messages by sender type

### Example Implementation (React Native / Flutter):

```javascript
// Connect to Socket.io
const socket = io('https://your-api-url.com', {
  auth: { token: managerToken }
});

// Join manager room
socket.emit('join-manager-room', { managerId: managerId });

// Listen for new messages
socket.on('notification', (data) => {
  if (data.type === 'message') {
    // Refresh inbox
    fetchInboxMessages();
    // Update unread count
    updateUnreadCount();
    // Show local notification
    showLocalNotification(data);
  }
});

// Fetch inbox
const fetchInboxMessages = async () => {
  const response = await api.get('/manager/messages/inbox');
  setMessages(response.data);
  const unread = response.data.filter(m => !m.isRead).length;
  setUnreadCount(unread);
};

// Send message
const sendMessage = async (toId, toType, message, subject, studentId) => {
  await api.post('/manager/messages', {
    toId,
    toType,
    message,
    subject,
    studentId
  });
  // Refresh outbox
  fetchOutboxMessages();
};
```

---

## 🔗 Related Documentation

- **Driver APIs:** See `MOBILE_API_DOCUMENTATION.md`
- **Parent APIs:** See `PARENT_APIS_IMPLEMENTATION_COMPLETE.md`
- **Teacher APIs:** See `TEACHER_MOBILE_APIS_DOCUMENTATION.md`
- **FCM Setup:** See `MOBILE_APP_FCM_TOKEN_GUIDE.md`
- **Socket.io Guide:** See `MOBILE_APP_INTEGRATION_DOCUMENTATION.md`

---

## 📞 Support

For questions or issues with these endpoints, please refer to the main API documentation or contact the development team.

**Last Updated:** January 2024
**Version:** 1.1

