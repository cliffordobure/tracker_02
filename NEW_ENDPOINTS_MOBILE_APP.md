# New Endpoints for Mobile App Integration

This document lists all new endpoints and updates added during the recent development session that mobile apps may need to integrate.

---

## 📋 Summary of Changes

### New Endpoints Added:
1. **Admin Messaging Endpoints** (4 new endpoints)
2. **Manager Messaging Endpoints** (5 new endpoints)
3. **Manager Parent Management** (2 new endpoints)
4. **Updated Response Fields** (Driver speed, Teacher multiple classes, Student photos)

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
- Message: `from` and `to` now support `'admin'` as a value

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

## 🔗 Related Documentation

- **Driver APIs:** See `MOBILE_API_DOCUMENTATION.md`
- **Parent APIs:** See `PARENT_APIS_IMPLEMENTATION_COMPLETE.md`
- **Teacher APIs:** See `TEACHER_MOBILE_APIS_DOCUMENTATION.md`
- **FCM Setup:** See `MOBILE_APP_FCM_TOKEN_GUIDE.md`

---

## 📞 Support

For questions or issues with these endpoints, please refer to the main API documentation or contact the development team.

**Last Updated:** January 2024
**Version:** 1.0

