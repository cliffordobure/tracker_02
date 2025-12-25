# Driver Messaging API - Complete Documentation

## Overview

This document provides complete API documentation for driver messaging functionality. Drivers can send messages to parents and managers, and retrieve lists of available recipients.

---

## Endpoints

### 1. Get Driver's Manager

**Purpose**: Retrieve the manager associated with the driver's school for messaging purposes.

**Endpoint**: `GET /api/driver/manager`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Authentication**: Required (Driver token via `verifyDriver` middleware)

**Response** (Success - 200):
```json
{
  "success": true,
  "manager": {
    "_id": "manager_id_here",
    "id": "manager_id_here",
    "name": "Manager Name",
    "email": "manager@example.com",
    "phone": "+1234567890",
    "photo": "photo_url_or_base64",
    "status": "Active",
    "sid": "school_id_here"
  }
}
```

**Response** (Error - 404):
```json
{
  "success": false,
  "message": "Manager not found for your school"
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Driver does not have a school ID assigned"
}
```

---

### 2. Get Parents List

**Purpose**: Get list of all parents in the driver's school that can be messaged.

**Endpoint**: `GET /api/driver/parents`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Authentication**: Required (Driver token via `verifyDriver` middleware)

**Response** (Success - 200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "parent_id",
      "id": "parent_id",
      "name": "Parent Name",
      "email": "parent@example.com",
      "phone": "+1234567890",
      "photo": "photo_url_or_null",
      "status": "Active",
      "students": [
        {
          "_id": "student_id",
          "id": "student_id",
          "name": "Student Name",
          "grade": "Grade 5",
          "photo": "photo_url_or_null"
        }
      ],
      "sid": "school_id"
    }
  ]
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Driver does not have a school ID assigned"
}
```

**Notes**:
- Returns only active parents in the driver's school
- Includes students associated with each parent
- Parents are sorted alphabetically by name

---

### 3. Get Students List

**Purpose**: Get list of all students in the driver's school (useful for selecting a student when messaging a parent).

**Endpoint**: `GET /api/driver/students`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Authentication**: Required (Driver token via `verifyDriver` middleware)

**Response** (Success - 200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "student_id",
      "id": "student_id",
      "name": "Student Name",
      "grade": "Grade 5",
      "photo": "photo_url_or_null",
      "status": "Active",
      "parents": [
        {
          "_id": "parent_id",
          "id": "parent_id",
          "name": "Parent Name",
          "email": "parent@example.com",
          "phone": "+1234567890"
        }
      ]
    }
  ]
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Driver does not have a school ID assigned"
}
```

**Notes**:
- Returns only active, non-deleted students in the driver's school
- Includes parent information for each student
- Students are sorted alphabetically by name

---

### 4. Send Message from Driver

**Purpose**: Allow drivers to send messages to parents or managers.

**Endpoint**: `POST /api/driver/messages`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Authentication**: Required (Driver token via `verifyDriver` middleware)

**Request Body**:
```json
{
  "toId": "recipient_id_here",
  "toType": "parent" | "manager",
  "message": "Message content here",
  "subject": "Optional subject",
  "studentId": "optional_student_id",
  "attachments": ["optional", "attachment", "urls"]
}
```

**Required Fields**:
- `toId` (string): ID of the recipient (parent or manager)
- `toType` (string): Either "parent" or "manager"
- `message` (string): The message content

**Optional Fields**:
- `subject` (string): Message subject
- `studentId` (string): Related student ID (only valid when toType is "parent")
- `attachments` (array): Array of attachment URLs

**Response** (Success - 201):
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "message_id",
    "to": {
      "id": "recipient_id",
      "name": "Recipient Name",
      "type": "parent" | "manager"
    },
    "subject": "Message subject",
    "message": "Message content",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Missing required fields: toId, toType, and message are required"
}
```

**Response** (Error - 403):
```json
{
  "success": false,
  "message": "Access denied. Recipient does not belong to your school."
}
```

**Response** (Error - 404):
```json
{
  "success": false,
  "message": "Recipient not found"
}
```

---

## Mobile App Integration Guide

### Step 1: Fetch Parents List

When the user opens the compose message screen and selects "Parent" as recipient type:

```javascript
// Fetch parents list
const fetchParents = async () => {
  try {
    const response = await api.get('/driver/parents', {
      headers: {
        'Authorization': `Bearer ${driverToken}`
      }
    });
    
    if (response.data.success) {
      setParents(response.data.data);
    }
  } catch (error) {
    console.error('Failed to fetch parents:', error);
    toast.error('Failed to load parents');
  }
};
```

### Step 2: Fetch Manager

When the user selects "Manager" as recipient type:

```javascript
// Fetch manager
const fetchManager = async () => {
  try {
    const response = await api.get('/driver/manager', {
      headers: {
        'Authorization': `Bearer ${driverToken}`
      }
    });
    
    if (response.data.success) {
      setManager(response.data.manager);
    }
  } catch (error) {
    console.error('Failed to fetch manager:', error);
    toast.error('Failed to load manager');
  }
};
```

### Step 3: Fetch Students (Optional)

If you want to allow drivers to select a student when messaging a parent:

```javascript
// Fetch students list
const fetchStudents = async () => {
  try {
    const response = await api.get('/driver/students', {
      headers: {
        'Authorization': `Bearer ${driverToken}`
      }
    });
    
    if (response.data.success) {
      setStudents(response.data.data);
    }
  } catch (error) {
    console.error('Failed to fetch students:', error);
  }
};
```

### Step 4: Send Message

```javascript
const sendMessage = async () => {
  try {
    const messageData = {
      toId: selectedRecipient.id,
      toType: recipientType, // "parent" or "manager"
      message: messageText,
      subject: subjectText || '',
      studentId: selectedStudent?.id || null,
      attachments: attachments || []
    };

    const response = await api.post('/driver/messages', messageData, {
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      toast.success('Message sent successfully');
      // Navigate back or clear form
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to send message');
    }
  }
};
```

---

## Complete Flow Example

```javascript
import { useState, useEffect } from 'react';
import api from './services/api';

const ComposeMessage = () => {
  const [recipientType, setRecipientType] = useState('parent');
  const [parents, setParents] = useState([]);
  const [manager, setManager] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (recipientType === 'parent') {
      fetchParents();
      fetchStudents(); // Optional: to show students when parent is selected
    } else if (recipientType === 'manager') {
      fetchManager();
    }
  }, [recipientType]);

  const fetchParents = async () => {
    try {
      const response = await api.get('/driver/parents');
      if (response.data.success) {
        setParents(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    }
  };

  const fetchManager = async () => {
    try {
      const response = await api.get('/driver/manager');
      if (response.data.success) {
        setManager(response.data.manager);
        setSelectedRecipient(response.data.manager);
      }
    } catch (error) {
      console.error('Failed to fetch manager:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/driver/students');
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient || !message.trim()) {
      toast.error('Please select a recipient and enter a message');
      return;
    }

    try {
      const messageData = {
        toId: selectedRecipient.id || selectedRecipient._id,
        toType: recipientType,
        message: message,
        subject: subject || '',
        studentId: selectedStudent?.id || null
      };

      const response = await api.post('/driver/messages', messageData);
      
      if (response.data.success) {
        toast.success('Message sent successfully');
        // Reset form
        setMessage('');
        setSubject('');
        setSelectedRecipient(null);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <View>
      {/* Recipient Type Selector */}
      <Picker
        selectedValue={recipientType}
        onValueChange={(value) => {
          setRecipientType(value);
          setSelectedRecipient(null);
        }}
      >
        <Picker.Item label="Parent" value="parent" />
        <Picker.Item label="Manager" value="manager" />
      </Picker>

      {/* Recipient Selector */}
      {recipientType === 'parent' && (
        <Picker
          selectedValue={selectedRecipient?.id}
          onValueChange={(value) => {
            const parent = parents.find(p => p.id === value);
            setSelectedRecipient(parent);
          }}
        >
          <Picker.Item label="Select Parent" value="" />
          {parents.map(parent => (
            <Picker.Item
              key={parent.id}
              label={parent.name}
              value={parent.id}
            />
          ))}
        </Picker>
      )}

      {/* Student Selector (Optional, only for parents) */}
      {recipientType === 'parent' && selectedRecipient && (
        <Picker
          selectedValue={selectedStudent?.id}
          onValueChange={(value) => {
            const student = students.find(s => s.id === value);
            setSelectedStudent(student);
          }}
        >
          <Picker.Item label="Select Student (Optional)" value="" />
          {students
            .filter(s => s.parents.some(p => p.id === selectedRecipient.id))
            .map(student => (
              <Picker.Item
                key={student.id}
                label={student.name}
                value={student.id}
              />
            ))}
        </Picker>
      )}

      {/* Subject Input */}
      <TextInput
        placeholder="Subject (Optional)"
        value={subject}
        onChangeText={setSubject}
      />

      {/* Message Input */}
      <TextInput
        placeholder="Type your message..."
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {/* Send Button */}
      <Button title="Send Message" onPress={handleSend} />
    </View>
  );
};
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error message (in development mode)"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (access denied, school mismatch)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Notes

1. **School ID Verification**: All messaging operations verify that the driver and recipient belong to the same school (same `sid`).

2. **Student Validation**: When sending to a parent with a `studentId`, the system verifies that the student actually belongs to that parent.

3. **Socket Notifications**: When a driver sends a message, a socket notification is automatically emitted to the recipient.

4. **Authentication**: All endpoints require driver authentication via JWT token in the Authorization header.

5. **Manager Photo Field**: The manager model uses `image` field, but the API response maps it to `photo` for consistency.

---

## Testing Checklist

- [ ] GET `/api/driver/parents` returns list of parents in driver's school
- [ ] GET `/api/driver/students` returns list of students in driver's school
- [ ] GET `/api/driver/manager` returns manager when driver has valid SID
- [ ] GET `/api/driver/manager` returns 404 when no manager found
- [ ] GET `/api/driver/manager` returns 400 when driver has no SID
- [ ] POST `/api/driver/messages` with valid parent ID sends message
- [ ] POST `/api/driver/messages` with valid manager ID sends message
- [ ] POST `/api/driver/messages` validates school ID match
- [ ] POST `/api/driver/messages` validates student belongs to parent
- [ ] POST `/api/driver/messages` sends socket notification
- [ ] POST `/api/driver/messages` returns 400 for missing fields
- [ ] POST `/api/driver/messages` returns 403 for cross-school messaging
- [ ] POST `/api/driver/messages` returns 404 for invalid recipient


