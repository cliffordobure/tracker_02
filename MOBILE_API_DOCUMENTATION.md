# Mobile App API Documentation

This document describes all the APIs available for the Parent and Driver mobile applications.

> **📌 NEW ENDPOINTS:** See `NEW_ENDPOINTS_MOBILE_APP.md` for recently added endpoints including admin messaging, manager parent management, driver speed, and student photos.

## Base URL
```
http://your-server-domain:5000/api
```

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Driver APIs

### 1. Driver Login
**Endpoint:** `POST /api/auth/driver/login`

**Request Body:**
```json
{
  "email": "driver@example.com",
  "password": "password123",
  "deviceToken": "fcm_device_token_here" // Optional, for push notifications
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "driver_id",
    "name": "Driver Name",
    "email": "driver@example.com",
    "photo": "/uploads/driver-photo.jpg",
    "role": "driver",
    "sid": "school_id"
  }
}
```

---

### 2. Get Driver's Route and Students
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
    "stops": [
      {
        "id": "stop_id",
        "name": "Stop Name",
        "address": "123 Main St",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "order": 1
      }
    ]
  },
  "students": [
    {
      "id": "student_id",
      "name": "John Doe",
      "photo": "/uploads/student.jpg",
      "grade": "Grade 5",
      "address": "456 Oak Ave",
      "latitude": 40.7580,
      "longitude": -73.9855,
      "pickup": "2024-01-15T08:30:00.000Z",
      "dropped": "",
      "status": "Active",
      "parents": [
        {
          "id": "parent_id",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "phone": "+1234567890",
          "deviceToken": "fcm_token"
        }
      ]
    }
  ]
}
```

---

### 3. Update Driver Location (Real-time)
**Endpoint:** `POST /api/driver/location`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "message": "Location updated successfully",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Socket.io Event:** This also emits `driver-location-update` to the route room for real-time tracking.

---

### 4. Start Journey
**Endpoint:** `POST /api/driver/journey/start`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (No body required - uses driver's assigned route)

**Response:**
```json
{
  "message": "Journey started successfully",
  "journeyType": "pickup", // or "drop-off"
  "route": {
    "id": "route_id",
    "name": "Route 1"
  },
  "studentsCount": 15,
  "notificationsSent": 30
}
```

**Socket.io Events:** 
- Emits `notification` to all parents connected to the route
- Emits `journey-started` to route room

---

### 5. Mark Student as Picked Up
**Endpoint:** `POST /api/driver/student/pickup`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student_id_here"
}
```

**Response:**
```json
{
  "message": "Student marked as picked up",
  "student": {
    "id": "student_id",
    "name": "John Doe",
    "pickup": "2024-01-15T08:30:00.000Z"
  }
}
```

**Socket.io Event:** Emits `notification` to student's parents and `student-picked-up` to route room.

---

### 6. Mark Student as Dropped
**Endpoint:** `POST /api/driver/student/drop`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student_id_here"
}
```

**Response:**
```json
{
  "message": "Student marked as dropped",
  "student": {
    "id": "student_id",
    "name": "John Doe",
    "dropped": "2024-01-15T15:30:00.000Z"
  }
}
```

**Socket.io Event:** Emits `notification` to student's parents and `student-dropped` to route room.

---

### 7. Get Journey Status
**Endpoint:** `GET /api/driver/journey/status`

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
    "name": "Route 1"
  },
  "journeyType": "pickup", // or "drop-off"
  "status": {
    "total": 15,
    "completed": 8,
    "remaining": 7,
    "progress": 53 // percentage
  },
  "students": [
    {
      "id": "student_id",
      "name": "John Doe",
      "pickup": "2024-01-15T08:30:00.000Z",
      "dropped": "",
      "status": "Active"
    }
  ]
}
```

---

## Parent APIs

### 1. Parent Login
**Endpoint:** `POST /api/auth/parent/login`

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "password123",
  "deviceToken": "fcm_device_token_here" // Optional, for push notifications
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
    "email": "parent@example.com",
    "photo": "/uploads/parent-photo.jpg",
    "role": "parent"
  }
}
```

---

### 2. Get Parent's Students with Route Info
**Endpoint:** `GET /api/parent/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "success",
  "data": [
    {
      "id": "student_id",
      "name": "John Doe",
      "photo": "/uploads/student.jpg",
      "grade": "Grade 5",
      "address": "456 Oak Ave",
      "latitude": 40.7580,
      "longitude": -73.9855,
      "pickup": "2024-01-15T08:30:00.000Z",
      "dropped": "",
      "status": "Active",
      "route": {
        "id": "route_id",
        "name": "Route 1",
        "driver": {
          "id": "driver_id",
          "name": "Driver Name",
          "phone": "+1234567890",
          "photo": "/uploads/driver.jpg",
          "vehicleNumber": "ABC-123",
          "location": {
            "latitude": 40.7128,
            "longitude": -74.0060
          }
        },
        "stops": [
          {
            "id": "stop_id",
            "name": "Stop Name",
            "address": "123 Main St",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "order": 1
          }
        ]
      }
    }
  ]
}
```

---

### 3. Get Student Status (Real-time)
**Endpoint:** `GET /api/parent/students/:studentId/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "success",
  "student": {
    "id": "student_id",
    "name": "John Doe",
    "photo": "/uploads/student.jpg",
    "grade": "Grade 5",
    "address": "456 Oak Ave",
    "latitude": 40.7580,
    "longitude": -73.9855,
    "pickup": "2024-01-15T08:30:00.000Z",
    "dropped": "",
    "status": "Active",
    "route": {
      "id": "route_id",
      "name": "Route 1",
      "driver": {
        "id": "driver_id",
        "name": "Driver Name",
        "phone": "+1234567890",
        "photo": "/uploads/driver.jpg",
        "vehicleNumber": "ABC-123",
        "location": {
          "latitude": 40.7128,
          "longitude": -74.0060,
          "timestamp": "2024-01-15T10:30:00.000Z"
        }
      },
      "stops": []
    }
  }
}
```

---

### 4. Get Driver Location (Real-time)
**Endpoint:** `GET /api/parent/students/:studentId/driver-location`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "success",
  "driver": {
    "id": "driver_id",
    "name": "Driver Name",
    "phone": "+1234567890",
    "photo": "/uploads/driver.jpg",
    "vehicleNumber": "ABC-123",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 5. Get Notifications
**Endpoint:** `GET /api/parent/notifications`

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "success",
  "data": [
    {
      "id": "notification_id",
      "message": "✅ John Doe has been picked up by the bus",
      "type": "student_picked_up",
      "isRead": false,
      "student": {
        "id": "student_id",
        "name": "John Doe",
        "photo": "/uploads/student.jpg"
      },
      "route": {
        "id": "route_id",
        "name": "Route 1"
      },
      "createdAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### 6. Mark Notification as Read
**Endpoint:** `PUT /api/parent/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "notification_id",
    "isRead": true
  }
}
```

---

### 7. Mark All Notifications as Read
**Endpoint:** `PUT /api/parent/notifications/read-all`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

---

### 8. Update Parent Profile
**Endpoint:** `PUT /api/parent/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "photo": "/uploads/new-photo.jpg",
  "phone": "+1234567890",
  "deviceToken": "new_fcm_token"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "parent_id",
    "name": "Updated Name",
    "email": "newemail@example.com",
    "photo": "/uploads/new-photo.jpg",
    "phone": "+1234567890"
  }
}
```

---

## Socket.io Real-time Events

### Connection
Connect to Socket.io server:
```javascript
const socket = io('http://your-server-domain:5000', {
  transports: ['websocket', 'polling']
});
```

---

### For Drivers

#### Join Driver Room
```javascript
socket.emit('join-driver-room', { driverId: 'driver_id' });
```

#### Join Route Room
```javascript
socket.emit('join-route-room', { routeId: 'route_id' });
```

---

### For Parents

#### Join Parent Room (for notifications)
```javascript
socket.emit('join-parent-room', { parentId: 'parent_id' });
```

#### Join Route Room (for driver location)
```javascript
socket.emit('join-route-room', { routeId: 'route_id' });
```

---

### Events Parents Can Listen To

#### 1. Notification Event
```javascript
socket.on('notification', (data) => {
  // data structure:
  {
    type: 'journey_started' | 'student_picked_up' | 'student_dropped',
    routeId: 'route_id',
    routeName: 'Route 1',
    driverId: 'driver_id',
    driverName: 'Driver Name',
    journeyType: 'pickup' | 'drop-off',
    message: 'Notification message',
    timestamp: '2024-01-15T10:30:00.000Z',
    studentId: 'student_id', // if applicable
    studentName: 'John Doe' // if applicable
  }
});
```

#### 2. Driver Location Update
```javascript
socket.on('driver-location-update', (data) => {
  // data structure:
  {
    driverId: 'driver_id',
    driverName: 'Driver Name',
    latitude: 40.7128,
    longitude: -74.0060,
    routeId: 'route_id',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
});
```

#### 3. Journey Started
```javascript
socket.on('journey-started', (data) => {
  // Same structure as notification event
});
```

#### 4. Student Picked Up
```javascript
socket.on('student-picked-up', (data) => {
  // data structure:
  {
    studentId: 'student_id',
    studentName: 'John Doe',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
});
```

#### 5. Student Dropped
```javascript
socket.on('student-dropped', (data) => {
  // data structure:
  {
    studentId: 'student_id',
    studentName: 'John Doe',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
});
```

---

### Events Drivers Can Listen To

#### 1. Location Update Confirmation
```javascript
socket.on('location-update', (data) => {
  // Location broadcast confirmation
});
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

---

## Implementation Notes

1. **Real-time Location Tracking**: Drivers should send location updates every 10-30 seconds using `POST /api/driver/location`. Parents can listen to `driver-location-update` events in real-time.

2. **Journey Types**: The system automatically determines if it's morning pickup (before 12 PM) or afternoon drop-off (after 12 PM).

3. **Notifications**: All notifications are stored in the database and also sent via Socket.io for real-time updates. Push notifications via FCM can be added separately.

4. **Room Management**: Parents should join route rooms when viewing their student's route to receive real-time updates.

5. **Device Tokens**: Store device tokens during login to enable push notifications later.

---

## Example Mobile App Flow

### Driver App Flow:
1. Login → Get token
2. Get route and students → Display list
3. Join route room via Socket.io
4. Start journey → Notify parents
5. Update location every 10-30 seconds
6. Mark students as picked/dropped → Notify parents

### Parent App Flow:
1. Login → Get token
2. Get students → Display list
3. Join parent room and route room via Socket.io
4. Listen for notifications and location updates
5. View notifications and mark as read
6. Track driver location in real-time

