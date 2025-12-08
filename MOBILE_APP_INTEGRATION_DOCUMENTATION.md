# Mobile App Integration Documentation

## Overview

This document provides comprehensive API documentation for integrating the School Bus Tracker backend with mobile applications. It covers all new features including FCM push notifications, driver dashboard updates, parent diary signing, and messaging functionality.

---

## 🔔 Firebase Cloud Messaging (FCM) Setup

### Prerequisites

1. **Firebase Project Setup:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Cloud Messaging API
   - Generate a service account key (JSON file)

2. **Backend Configuration:**
   - Place the Firebase service account JSON file as `tracktoto-parent-firebase-adminsdk.json` in the project root
   - The file will be automatically loaded by the backend

3. **Mobile App Setup:**
   - Integrate Firebase SDK in your mobile app
   - Request notification permissions
   - Get FCM device token and send it to backend during login/registration

### Device Token Management

Device tokens should be sent to the backend in the following scenarios:
- **Login**: Include `deviceToken` in login request
- **Profile Update**: Update device token via profile update endpoint
- **Token Refresh**: Update token when it changes (FCM tokens can change)

---

## 🚗 Driver Mobile App APIs

### Authentication

#### Driver Login
**Endpoint:** `POST /api/auth/driver/login`

**Request Body:**
```json
{
  "email": "driver@school.com",
  "password": "password123",
  "deviceToken": "fcm_device_token_here" // optional but recommended
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "driver_id",
    "name": "John Driver",
    "email": "driver@school.com",
    "phone": "+1234567890",
    "role": "driver",
    "currentRoute": "route_id"
  }
}
```

---

### Dashboard & Route Management

#### Get Driver's Route and Students
**Endpoint:** `GET /api/driver/route`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "success",
  "route": {
    "id": "route_id",
    "name": "Route 1",
    "stops": [...]
  },
  "students": [
    {
      "id": "student_id",
      "name": "Jane Doe",
      "photo": "http://...",
      "grade": "PP1",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "pickup": null, // ISO timestamp when picked up
      "dropped": null, // ISO timestamp when dropped
      "status": "Active",
      "parents": [...]
    }
  ]
}
```

---

### Journey Management

#### Start Journey
**Endpoint:** `POST /api/driver/journey/start`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Description:** 
- Automatically determines if it's morning pickup (before 12 PM) or afternoon drop-off (after 12 PM)
- Resets student statuses accordingly
- Sends FCM notifications to all parents on the route

**Response:**
```json
{
  "success": true,
  "message": "Journey started successfully",
  "journeyType": "pickup", // or "drop-off"
  "route": {
    "id": "route_id",
    "name": "Route 1"
  },
  "studentsCount": 15,
  "notificationsSent": 15,
  "journeyStatus": "active"
}
```

**FCM Notification Sent to Parents:**
- **Title:** `🚌 Journey Started`
- **Body:** `🚌 The bus is now leaving school for morning pickup. Route: Route 1`
- **Data:**
  ```json
  {
    "type": "journey_started",
    "routeId": "route_id",
    "routeName": "Route 1",
    "journeyType": "pickup",
    "driverId": "driver_id",
    "driverName": "John Driver"
  }
  ```

---

### Student Status Updates

#### Mark Student as Boarded (Picked Up)
**Endpoint:** `POST /api/driver/student/pickup`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id"
}
```

**Response:**
```json
{
  "message": "Student marked as picked up",
  "student": {
    "id": "student_id",
    "name": "Jane Doe",
    "pickup": "2024-01-15T08:30:00.000Z"
  }
}
```

**FCM Notification Sent to Parents:**
- **Title:** `✅ Student Boarded`
- **Body:** `✅ Jane Doe has been picked up by the bus`
- **Data:**
  ```json
  {
    "type": "student_picked_up",
    "studentId": "student_id",
    "studentName": "Jane Doe",
    "routeId": "route_id",
    "routeName": "Route 1"
  }
  ```

#### Mark Student as Dropped
**Endpoint:** `POST /api/driver/student/drop`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id"
}
```

**Response:**
```json
{
  "message": "Student marked as dropped",
  "student": {
    "id": "student_id",
    "name": "Jane Doe",
    "dropped": "2024-01-15T15:30:00.000Z"
  }
}
```

**FCM Notification Sent to Parents:**
- **Title:** `🏠 Student Dropped`
- **Body:** `🏠 Jane Doe has been dropped off by the bus`
- **Data:**
  ```json
  {
    "type": "student_dropped",
    "studentId": "student_id",
    "studentName": "Jane Doe",
    "routeId": "route_id",
    "routeName": "Route 1"
  }
  ```

#### Get Journey Status
**Endpoint:** `GET /api/driver/journey/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "success",
  "route": {
    "id": "route_id",
    "name": "Route 1"
  },
  "journeyType": "pickup",
  "journeyStatus": "active",
  "status": {
    "total": 15,
    "completed": 8,
    "remaining": 7,
    "progress": 53
  },
  "students": [...]
}
```

---

## 👨‍👩‍👧 Parent Mobile App APIs

### Authentication

#### Parent Login
**Endpoint:** `POST /api/auth/parent/login`

**Request Body:**
```json
{
  "email": "parent@email.com",
  "password": "password123",
  "deviceToken": "fcm_device_token_here" // optional but recommended
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "parent_id",
    "name": "Parent Name",
    "email": "parent@email.com",
    "phone": "+1234567890",
    "role": "parent"
  }
}
```

---

### Diary Management

#### Get Diary Entries
**Endpoint:** `GET /api/parent/diary`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `studentId` (optional) - Filter by student
- `date` (optional) - Filter by date (YYYY-MM-DD)

**Response:**
```json
{
  "message": "success",
  "data": [
    {
      "id": "entry_id",
      "student": {
        "id": "student_id",
        "name": "Jane Doe",
        "photo": "http://...",
        "grade": "PP1"
      },
      "teacher": {
        "id": "teacher_id",
        "name": "John Teacher"
      },
      "content": "Diary entry content...",
      "date": "2024-01-15T00:00:00.000Z",
      "attachments": ["http://..."],
      "parentSignature": {
        "signedBy": {
          "id": "parent_id",
          "name": "Parent Name"
        },
        "signedAt": "2024-01-15T10:00:00.000Z",
        "signature": "base64_encoded_signature"
      } | null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Sign Diary Entry
**Endpoint:** `POST /api/parent/diary/:entryId/sign`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "signature": "base64_encoded_signature_image_or_text"
}
```

**Description:**
- Parents can sign diary entries to acknowledge they've read them
- Signature can be a base64-encoded image or text
- Sends FCM notification to the teacher

**Response:**
```json
{
  "message": "Diary entry signed successfully",
  "data": {
    "id": "entry_id",
    "parentSignature": {
      "signedBy": {
        "id": "parent_id",
        "name": "Parent Name"
      },
      "signedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**FCM Notification Sent to Teacher:**
- **Title:** `✅ Diary Signed`
- **Body:** `✅ Parent Name has signed the diary entry for Jane Doe`
- **Data:**
  ```json
  {
    "type": "diary_signed",
    "diaryId": "entry_id",
    "studentId": "student_id",
    "studentName": "Jane Doe",
    "parentName": "Parent Name"
  }
  ```

---

### Messaging

#### Send Message to Driver
**Endpoint:** `POST /api/parent/messages/driver`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "driverId": "driver_id",
  "studentId": "student_id", // optional
  "subject": "Message about bus route", // optional
  "message": "Hello, I wanted to discuss...",
  "attachments": ["http://..."] // optional
}
```

**Response:**
```json
{
  "message": "Message sent to driver successfully",
  "data": {
    "id": "message_id",
    "to": {
      "id": "driver_id",
      "name": "John Driver",
      "type": "driver"
    },
    "subject": "Message about bus route",
    "message": "Hello, I wanted to discuss...",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**FCM Notification Sent to Driver:**
- **Title:** `💬 New Message`
- **Body:** `💬 New message from Parent Name about Jane Doe`
- **Data:**
  ```json
  {
    "type": "message",
    "messageId": "message_id",
    "fromId": "parent_id",
    "fromName": "Parent Name",
    "fromType": "parent",
    "subject": "Message about bus route",
    "studentId": "student_id"
  }
  ```

#### Send Message to Teacher
**Endpoint:** `POST /api/parent/messages/teacher`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "teacherId": "teacher_id",
  "studentId": "student_id", // optional
  "subject": "Message about Jane", // optional
  "message": "Hello, I wanted to discuss...",
  "attachments": ["http://..."] // optional
}
```

**Response:**
```json
{
  "message": "Message sent to teacher successfully",
  "data": {
    "id": "message_id",
    "to": {
      "id": "teacher_id",
      "name": "John Teacher",
      "type": "teacher"
    },
    "subject": "Message about Jane",
    "message": "Hello, I wanted to discuss...",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**FCM Notification Sent to Teacher:**
- **Title:** `💬 New Message`
- **Body:** `💬 New message from Parent Name about Jane Doe`
- **Data:**
  ```json
  {
    "type": "message",
    "messageId": "message_id",
    "fromId": "parent_id",
    "fromName": "Parent Name",
    "fromType": "parent",
    "subject": "Message about Jane",
    "studentId": "student_id"
  }
  ```

#### Get Messages
**Endpoint:** `GET /api/parent/messages`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `type` (optional) - Filter by type
- `isRead` (optional) - Filter by read status (true/false)
- `studentId` (optional) - Filter by student

**Response:**
```json
{
  "message": "success",
  "data": [
    {
      "id": "message_id",
      "from": {
        "id": "sender_id",
        "name": "Sender Name",
        "type": "driver" // or "teacher"
      },
      "to": {
        "id": "receiver_id",
        "type": "parent"
      },
      "student": {
        "id": "student_id",
        "name": "Jane Doe",
        "photo": "http://..."
      } | null,
      "subject": "Message subject",
      "message": "Message content...",
      "type": "direct",
      "isRead": false,
      "attachments": ["http://..."],
      "parentMessageId": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Reply to Message
**Endpoint:** `POST /api/parent/messages/:messageId/reply`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Thank you for your message...",
  "attachments": ["http://..."] // optional
}
```

**Response:**
```json
{
  "message": "Reply sent successfully",
  "data": {
    "id": "reply_id",
    "subject": "Re: Original subject",
    "message": "Thank you for your message...",
    "parentMessageId": "original_message_id",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**FCM Notification Sent to Recipient (Driver/Teacher):**
- **Title:** `💬 New Reply`
- **Body:** `💬 Reply from Parent Name`
- **Data:**
  ```json
  {
    "type": "message",
    "messageId": "reply_id",
    "fromId": "parent_id",
    "fromName": "Parent Name",
    "fromType": "parent",
    "subject": "Re: Original subject"
  }
  ```

---

## 📱 FCM Notification Handling

### Notification Types

The mobile app should handle the following notification types:

1. **journey_started**
   - Triggered when driver starts journey
   - Action: Show journey start notification, update route status

2. **student_picked_up**
   - Triggered when student boards the bus
   - Action: Update student status, show notification

3. **student_dropped**
   - Triggered when student is dropped off
   - Action: Update student status, show notification

4. **message**
   - Triggered when receiving a new message
   - Action: Navigate to messages screen, show notification

5. **diary_signed**
   - Triggered when parent signs a diary (for teachers)
   - Action: Update diary entry status

### Notification Data Structure

All FCM notifications include:
```json
{
  "type": "notification_type",
  "message": "Notification message",
  "timestamp": "2024-01-15T10:00:00.000Z",
  // Additional type-specific data
}
```

### Handling Notification Taps

When a user taps on a notification:

1. **journey_started**: Navigate to route tracking screen
2. **student_picked_up/dropped**: Navigate to student status screen
3. **message**: Navigate to message detail screen
4. **diary_signed**: Navigate to diary entry screen

---

## 🔄 Real-time Updates (Socket.io)

### Connection

Connect to Socket.io server:
```javascript
const socket = io('http://your-backend-url', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Join Rooms

**Parent:**
```javascript
socket.emit('join-parent-room', { parentId: 'parent_id' });
socket.emit('join-route-room', { routeId: 'route_id' });
```

**Driver:**
```javascript
socket.emit('join-driver-room', { driverId: 'driver_id' });
socket.emit('join-route-room', { routeId: 'route_id' });
```

**Teacher:**
```javascript
socket.emit('join-teacher-room', { teacherId: 'teacher_id' });
```

### Listen for Events

**Notifications:**
```javascript
socket.on('notification', (data) => {
  // Handle notification
  console.log('Notification:', data);
});
```

**Driver Location Updates:**
```javascript
socket.on('driver-location-update', (data) => {
  // Update map with driver location
  console.log('Driver location:', data);
});
```

**Journey Events:**
```javascript
socket.on('journey-started', (data) => {
  // Handle journey start
});

socket.on('journey-ended', (data) => {
  // Handle journey end
});

socket.on('student-picked-up', (data) => {
  // Handle student pickup
});

socket.on('student-dropped', (data) => {
  // Handle student drop
});
```

---

## 🎨 Frontend Web Additions

### Driver Dashboard

Add the following UI components to the driver dashboard:

1. **Student List with Status**
   - Show all students on the route
   - Display pickup/drop status for each student
   - Quick action buttons: "Mark as Boarded" / "Mark as Dropped"

2. **Journey Controls**
   - "Start Journey" button
   - Journey status indicator (idle/active/completed)
   - Progress indicator showing completed/total students

3. **Real-time Updates**
   - Live status updates as students are marked
   - Visual indicators for completed actions

### Parent Dashboard

Add the following UI components to the parent dashboard:

1. **Diary Signing**
   - "Sign Diary" button on diary entries
   - Signature capture interface (drawing pad or text input)
   - Visual indicator showing signed/unsigned status

2. **Messaging Interface**
   - "Message Driver" button
   - "Message Teacher" button
   - Message composer with subject and message fields
   - Message history view

3. **Notification Center**
   - Real-time notification display
   - Notification history
   - Mark as read functionality

---

## 🔐 Security & Best Practices

### Authentication
- Always include JWT token in Authorization header
- Token expires after 7 days (default)
- Refresh token on expiry

### Error Handling
- Handle 401 (Unauthorized) by redirecting to login
- Handle 403 (Forbidden) by showing appropriate message
- Handle 404 (Not Found) gracefully
- Handle 500 (Server Error) with user-friendly message

### FCM Token Management
- Request notification permissions on app start
- Send device token to backend on login
- Update token when it changes
- Handle token refresh gracefully

### Offline Support
- Cache route and student data
- Queue API requests when offline
- Sync when connection restored
- Show offline indicator

---

## 📋 Testing Checklist

### Driver App
- [ ] Login with device token
- [ ] View route and students
- [ ] Start journey (morning/afternoon)
- [ ] Mark student as boarded
- [ ] Mark student as dropped
- [ ] Receive FCM notifications
- [ ] View journey status

### Parent App
- [ ] Login with device token
- [ ] View diary entries
- [ ] Sign diary entry
- [ ] Send message to driver
- [ ] Send message to teacher
- [ ] Reply to messages
- [ ] Receive FCM notifications
- [ ] View notification history

### FCM Notifications
- [ ] Journey start notification
- [ ] Student boarded notification
- [ ] Student dropped notification
- [ ] Message notifications
- [ ] Diary signed notification

---

## 🚀 Integration Steps

1. **Setup Firebase**
   - Create Firebase project
   - Generate service account key
   - Place JSON file in backend root

2. **Backend Configuration**
   - Ensure FCM service is enabled
   - Test FCM with sample tokens
   - Verify notification delivery

3. **Mobile App Integration**
   - Integrate Firebase SDK
   - Request notification permissions
   - Implement token management
   - Handle incoming notifications
   - Connect to Socket.io

4. **Testing**
   - Test all endpoints
   - Verify FCM notifications
   - Test real-time updates
   - Verify offline handling

5. **Deployment**
   - Deploy backend with FCM enabled
   - Configure production Firebase project
   - Update mobile app with production endpoints
   - Monitor notification delivery

---

## 📞 Support

For issues or questions:
- Check API response error messages
- Verify FCM token is valid
- Check Socket.io connection status
- Review server logs for errors

---

## ✅ Status: COMPLETE

All features have been implemented and are ready for mobile app integration:

- ✅ FCM push notifications
- ✅ Driver journey management
- ✅ Student boarding/dropping tracking
- ✅ Parent diary signing
- ✅ Parent-to-driver messaging
- ✅ Parent-to-teacher messaging
- ✅ Real-time Socket.io updates
- ✅ Comprehensive API documentation

**All endpoints are available and ready for integration!**

