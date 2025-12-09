# Teacher Mobile App APIs - Complete Documentation

## Overview

This document provides comprehensive API documentation for the Teacher mobile application. Teachers can manage their assigned class, update student status, manage diary entries, create notices, and communicate with parents.

---

## 🔐 Authentication

### Teacher Login
**Endpoint:** `POST /api/auth/teacher/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "password123",
  "deviceToken": "fcm_device_token_here" // optional
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "teacher_id",
    "name": "John Doe",
    "email": "teacher@school.com",
    "photo": "http://...",
    "role": "teacher",
    "sid": "school_id",
    "assignedClass": "PP1",
    "phone": "+1234567890"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account suspended

---

## 👤 Profile

### Get Teacher Profile
**Endpoint:** `GET /api/teacher/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "teacher_id",
    "name": "John Doe",
    "email": "teacher@school.com",
    "phone": "+1234567890",
    "photo": "http://...",
    "role": "teacher",
    "sid": "school_id",
    "schoolName": "School Name",
    "assignedClass": "PP1",
    "permissions": ["noticeboard", "send", "receive"]
  }
}
```

---

## 👨‍🎓 Students Management

### Get Students in Assigned Class
**Endpoint:** `GET /api/teacher/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": "student_id",
      "name": "Jane Doe",
      "photo": "http://...",
      "grade": "PP1",
      "address": "123 Main St",
      "status": "Active",
      "leftSchool": "2024-01-15T14:30:00.000Z", // null if not left yet
      "parents": [
        {
          "id": "parent_id",
          "name": "Parent Name",
          "email": "parent@email.com",
          "phone": "+1234567890",
          "photo": "http://..."
        }
      ],
      "route": {
        "id": "route_id",
        "name": "Route 1"
      }
    }
  ]
}
```

---

### Mark Student as Leaving School
**Endpoint:** `POST /api/teacher/students/:studentId/leave-school`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Description:** Marks a student as leaving school when the driver picks them up. This sends a notification to the student's parents.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student marked as leaving school successfully",
  "data": {
    "id": "student_id",
    "name": "Jane Doe",
    "leftSchool": "2024-01-15T14:30:00.000Z",
    "leftSchoolBy": "teacher_id"
  }
}
```

**Error Responses:**
- `403` - Student not in teacher's assigned class
- `404` - Student not found

**Note:** This automatically sends a notification to all parents of the student via Socket.io and creates a database notification.

---

## 📔 Diary Management

### Get Diary Entries
**Endpoint:** `GET /api/teacher/diary`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `studentId` (optional) - Filter by specific student
- `date` (optional) - Filter by date (YYYY-MM-DD format)

**Response (200 OK):**
```json
{
  "success": true,
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
        "name": "John Doe"
      },
      "content": "Diary entry content...",
      "date": "2024-01-15T00:00:00.000Z",
      "attachments": ["http://..."],
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

---

### Create Diary Entry
**Endpoint:** `POST /api/teacher/diary`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id",
  "content": "Today, Jane showed excellent progress in reading...",
  "date": "2024-01-15", // optional, defaults to today
  "attachments": ["http://..."] // optional array of file URLs
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Diary entry created successfully",
  "data": {
    "id": "entry_id",
    "student": {
      "id": "student_id",
      "name": "Jane Doe"
    },
    "content": "Today, Jane showed excellent progress...",
    "date": "2024-01-15T00:00:00.000Z",
    "attachments": [],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `403` - Student not in teacher's assigned class
- `404` - Student not found

**Note:** Creating a diary entry automatically sends notifications to the student's parents.

---

### Update Diary Entry
**Endpoint:** `PUT /api/teacher/diary/:entryId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated content...",
  "date": "2024-01-15", // optional
  "attachments": ["http://..."] // optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diary entry updated successfully",
  "data": {
    "id": "entry_id",
    "content": "Updated content...",
    "date": "2024-01-15T00:00:00.000Z",
    "attachments": [],
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `403` - Entry doesn't belong to teacher
- `404` - Entry not found

---

### Delete Diary Entry
**Endpoint:** `DELETE /api/teacher/diary/:entryId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diary entry deleted successfully"
}
```

**Error Responses:**
- `403` - Entry doesn't belong to teacher
- `404` - Entry not found

---

## 📢 Noticeboard Management

### Get Notices
**Endpoint:** `GET /api/teacher/notices`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `category` (optional) - Filter by category: general, event, academic, transport, fee

**Response (200 OK):**
```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": "notice_id",
      "title": "School Event",
      "message": "Notice content...",
      "category": "event",
      "priority": "high",
      "student": {
        "id": "student_id",
        "name": "Jane Doe",
        "photo": "http://..."
      } | null, // null for general notices
      "attachments": ["http://..."],
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

---

### Create Notice
**Endpoint:** `POST /api/teacher/notices`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "School Event",
  "message": "We are having a school event on...",
  "category": "event", // optional: general, event, academic, transport, fee
  "priority": "high", // optional: urgent, high, normal, low
  "studentId": "student_id", // optional - for student-specific notices
  "attachments": ["http://..."] // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Notice created successfully",
  "data": {
    "id": "notice_id",
    "title": "School Event",
    "message": "We are having a school event...",
    "category": "event",
    "priority": "high",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `403` - Student not in teacher's assigned class (if studentId provided)

**Note:** Creating a notice automatically sends notifications to relevant parents (student's parents if studentId provided, or all parents in school for general notices).

---

### Update Notice
**Endpoint:** `PUT /api/teacher/notices/:noticeId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "message": "Updated message...",
  "category": "academic", // optional
  "priority": "urgent", // optional
  "attachments": ["http://..."] // optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notice updated successfully",
  "data": {
    "id": "notice_id",
    "title": "Updated Title",
    "message": "Updated message...",
    "category": "academic",
    "priority": "urgent",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `403` - Notice doesn't belong to teacher's school
- `404` - Notice not found

---

### Delete Notice
**Endpoint:** `DELETE /api/teacher/notices/:noticeId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notice deleted successfully"
}
```

**Error Responses:**
- `403` - Notice doesn't belong to teacher's school
- `404` - Notice not found

---

## 💬 Messaging Parents

### Get Messages
**Endpoint:** `GET /api/teacher/messages`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `type` (optional) - Filter: 'sent' or 'received'

**Response (200 OK):**
```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": "message_id",
      "from": {
        "id": "sender_id",
        "name": "Sender Name",
        "photo": "http://...",
        "type": "parent" // or "teacher"
      },
      "to": {
        "id": "receiver_id",
        "name": "Receiver Name",
        "photo": "http://...",
        "type": "parent" // or "teacher"
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
      "parentMessageId": null, // or message_id if this is a reply
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

---

### Send Message to Parent
**Endpoint:** `POST /api/teacher/messages`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "toId": "parent_id",
  "studentId": "student_id", // optional
  "subject": "Message about Jane", // optional
  "message": "Hello, I wanted to discuss...",
  "attachments": ["http://..."] // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "message_id",
    "to": {
      "id": "parent_id",
      "name": "Parent Name"
    },
    "subject": "Message about Jane",
    "message": "Hello, I wanted to discuss...",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `403` - Student not in teacher's assigned class (if studentId provided)
- `404` - Parent not found

**Note:** Sending a message automatically creates a notification for the parent and sends a real-time Socket.io event.

---

### Reply to Message
**Endpoint:** `POST /api/teacher/messages/:messageId/reply`

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

**Response (201 Created):**
```json
{
  "success": true,
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

**Error Responses:**
- `400` - Missing message content
- `403` - Access denied (message not sent to teacher)
- `404` - Original message not found

---

## 🔒 Security & Access Control

### Access Control Rules

1. **Class-Based Access**: Teachers can only access students in their assigned class (`assignedClass` field)
2. **School-Based Access**: Teachers can only access data from their school (`sid` field)
3. **Ownership Verification**: Teachers can only modify diary entries and notices they created
4. **Student Verification**: When updating student status, the system verifies the student is in the teacher's class

### Error Codes

- `ACCESS_DENIED` - User doesn't have permission
- `MISSING_FIELDS` - Required fields are missing
- `STUDENT_NOT_FOUND` - Student doesn't exist
- `TEACHER_NOT_FOUND` - Teacher doesn't exist
- `PARENT_NOT_FOUND` - Parent doesn't exist
- `ENTRY_NOT_FOUND` - Diary entry not found
- `NOTICE_NOT_FOUND` - Notice not found
- `MESSAGE_NOT_FOUND` - Message not found

---

## 📱 Real-time Features

### Socket.io Events

Teachers can receive real-time notifications via Socket.io:

1. **Join Teacher Room**: `join-teacher-room` with `{ teacherId }`
2. **Notifications**: Listen to `notification` events in the teacher room

**Example:**
```javascript
socket.emit('join-teacher-room', { teacherId: 'teacher_id' });
socket.on('notification', (data) => {
  // Handle notification
});
```

---

## 📋 Manager Endpoints (For Adding Teachers)

Managers can manage teachers through these endpoints:

### Get All Teachers
**Endpoint:** `GET /api/manager/teachers`

### Create Teacher
**Endpoint:** `POST /api/manager/teachers`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "teacher@school.com",
  "password": "password123",
  "phone": "+1234567890",
  "assignedClass": "PP1",
  "permissions": ["noticeboard", "send", "receive"]
}
```

### Update Teacher
**Endpoint:** `PUT /api/manager/teachers/:id`

### Delete Teacher
**Endpoint:** `DELETE /api/manager/teachers/:id`

---

## 🧪 Testing Examples

### Example: Complete Workflow

1. **Login:**
```bash
POST /api/auth/teacher/login
{
  "email": "teacher@school.com",
  "password": "password123"
}
```

2. **Get Students:**
```bash
GET /api/teacher/students
Authorization: Bearer <token>
```

3. **Mark Student Leaving:**
```bash
POST /api/teacher/students/{studentId}/leave-school
Authorization: Bearer <token>
```

4. **Create Diary Entry:**
```bash
POST /api/teacher/diary
Authorization: Bearer <token>
{
  "studentId": "student_id",
  "content": "Great progress today!",
  "date": "2024-01-15"
}
```

5. **Create Notice:**
```bash
POST /api/teacher/notices
Authorization: Bearer <token>
{
  "title": "School Event",
  "message": "We have an event...",
  "category": "event",
  "priority": "high"
}
```

6. **Send Message to Parent:**
```bash
POST /api/teacher/messages
Authorization: Bearer <token>
{
  "toId": "parent_id",
  "studentId": "student_id",
  "subject": "About Jane",
  "message": "I wanted to discuss..."
}
```

---

## ✅ Status: COMPLETE

All teacher mobile app APIs have been implemented and are ready for use!

**Key Features:**
- ✅ Teacher authentication
- ✅ Student management (view class, mark leaving school)
- ✅ Diary management (CRUD operations)
- ✅ Noticeboard management (CRUD operations)
- ✅ Messaging parents (send, reply, view)
- ✅ Real-time notifications via Socket.io
- ✅ Proper access control and security

**All endpoints are available at `/api/teacher/*` with JWT authentication.**








