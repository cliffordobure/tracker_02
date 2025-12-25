# Driver Parents/Students API Implementation - Complete Guide

## Overview

This implementation allows drivers to get a list of **parents whose children are on the driver's current route**. This ensures drivers can only message parents of students they are actually transporting.

---

## Implementation Status

✅ **COMPLETED** - All endpoints are implemented and ready to use.

---

## API Endpoints

### 1. Get Parents (On Driver's Route)

**Endpoint**: `GET /api/driver/parents`

**Purpose**: Returns parents whose children are on the driver's current route.

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
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "photo": "photo_url_or_null",
      "status": "Active",
      "students": [
        {
          "_id": "student_id",
          "id": "student_id",
          "name": "Jane Doe",
          "grade": "Grade 5",
          "photo": "photo_url_or_null",
          "status": "Active"
        }
      ],
      "sid": "school_id"
    }
  ]
}
```

**Response** (No Route - 200):
```json
{
  "success": true,
  "data": [],
  "message": "No route assigned to driver"
}
```

**Response** (No Parents - 200):
```json
{
  "success": true,
  "data": [],
  "message": "No parents found for students on your route"
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Driver does not have a school ID assigned"
}
```

**Key Features**:
- Only returns parents of students on the driver's **current route**
- Includes students for each parent (only students on the route)
- Filters out deleted students and students on leave
- Only includes active parents
- Handles both route assignment methods (Student.route field and Route.students array)

---

### 2. Get Students (On Driver's Route)

**Endpoint**: `GET /api/driver/students`

**Purpose**: Returns students on the driver's current route with their parent information.

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
      "name": "Jane Doe",
      "grade": "Grade 5",
      "photo": "photo_url_or_null",
      "status": "Active",
      "parents": [
        {
          "_id": "parent_id",
          "id": "parent_id",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "photo": "photo_url_or_null"
        }
      ]
    }
  ]
}
```

**Response** (No Route - 200):
```json
{
  "success": true,
  "data": [],
  "message": "No route assigned to driver"
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Driver does not have a school ID assigned"
}
```

**Key Features**:
- Only returns students on the driver's **current route**
- Includes parent information for each student
- Filters out deleted students and students on leave
- Only includes active parents

---

### 3. Get Manager

**Endpoint**: `GET /api/driver/manager`

**Purpose**: Returns the manager for the driver's school.

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
    "_id": "manager_id",
    "id": "manager_id",
    "name": "Manager Name",
    "email": "manager@example.com",
    "phone": "+1234567890",
    "photo": "photo_url_or_base64",
    "status": "Active",
    "sid": "school_id"
  }
}
```

---

## Implementation Details

### Route Matching Logic

The implementation handles two methods of route assignment:

1. **Student.route field**: Students with `route` field matching the driver's `currentRoute`
2. **Route.students array**: Students whose ID is in the Route's `students` array

The query checks both methods to ensure all students on the route are found.

### Filtering

- **Students**: Only active, non-deleted students not on leave
- **Parents**: Only active parents
- **Route**: Only students on the driver's current assigned route

---

## File Locations

### Routes
**File**: `backend/routes/driver.js`

Routes are located at:
- Line ~409: `GET /manager`
- Line ~412: `GET /parents`
- Line ~415: `GET /students`

### Controllers
**File**: `backend/controllers/driverController.js`

Functions are located at:
- Line ~716: `exports.getManager`
- Line ~765: `exports.getParents`
- Line ~858: `exports.getStudents`

### Middleware
**File**: `backend/middleware/auth.js`

- `verifyDriver` middleware (already implemented)

---

## Mobile App Integration

### Step 1: Fetch Parents When User Selects "Parent"

```javascript
const fetchParents = async () => {
  try {
    const response = await api.get('/driver/parents', {
      headers: {
        'Authorization': `Bearer ${driverToken}`
      }
    });
    
    if (response.data.success) {
      // response.data.data contains array of parents
      // Each parent has a 'students' array with their children on the route
      setParents(response.data.data);
    } else if (response.data.message) {
      // Handle "No route assigned" or "No parents found" messages
      console.log(response.data.message);
      setParents([]);
    }
  } catch (error) {
    console.error('Failed to fetch parents:', error);
    if (error.response?.status === 400) {
      toast.error('Driver does not have a school assigned');
    } else {
      toast.error('Failed to load parents');
    }
  }
};
```

### Step 2: Fetch Students (Optional - for student selection)

```javascript
const fetchStudents = async () => {
  try {
    const response = await api.get('/driver/students', {
      headers: {
        'Authorization': `Bearer ${driverToken}`
      }
    });
    
    if (response.data.success) {
      // response.data.data contains array of students on the route
      setStudents(response.data.data);
    } else if (response.data.message) {
      console.log(response.data.message);
      setStudents([]);
    }
  } catch (error) {
    console.error('Failed to fetch students:', error);
  }
};
```

### Step 3: Display Parents in Dropdown

```javascript
// Example React Native Picker
<Picker
  selectedValue={selectedParentId}
  onValueChange={(value) => {
    const parent = parents.find(p => p.id === value);
    setSelectedParent(parent);
    // Optionally filter students for this parent
    if (parent && parent.students) {
      setAvailableStudents(parent.students);
    }
  }}
>
  <Picker.Item label="Select Parent" value="" />
  {parents.map(parent => (
    <Picker.Item
      key={parent.id}
      label={`${parent.name} (${parent.students?.length || 0} students)`}
      value={parent.id}
    />
  ))}
</Picker>
```

### Step 4: Display Students for Selected Parent

```javascript
// Show students when parent is selected
{selectedParent && selectedParent.students && selectedParent.students.length > 0 && (
  <Picker
    selectedValue={selectedStudentId}
    onValueChange={(value) => {
      const student = selectedParent.students.find(s => s.id === value);
      setSelectedStudent(student);
    }}
  >
    <Picker.Item label="Select Student (Optional)" value="" />
    {selectedParent.students.map(student => (
      <Picker.Item
        key={student.id}
        label={student.name}
        value={student.id}
      />
    ))}
  </Picker>
)}
```

---

## Complete Example Flow

```javascript
import { useState, useEffect } from 'react';
import { View, Text, Picker, TextInput, Button } from 'react-native';
import api from './services/api';
import toast from 'react-hot-toast';

const ComposeMessage = ({ driverToken }) => {
  const [recipientType, setRecipientType] = useState('parent');
  const [parents, setParents] = useState([]);
  const [manager, setManager] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipientType === 'parent') {
      fetchParents();
    } else if (recipientType === 'manager') {
      fetchManager();
    }
  }, [recipientType]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/driver/parents', {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      
      if (response.data.success) {
        setParents(response.data.data || []);
        if (response.data.data.length === 0 && response.data.message) {
          toast.info(response.data.message);
        }
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error);
      toast.error(error.response?.data?.message || 'Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const fetchManager = async () => {
    try {
      setLoading(true);
      const response = await api.get('/driver/manager', {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      
      if (response.data.success) {
        setManager(response.data.manager);
        setSelectedParent(response.data.manager); // Use same state for manager
      }
    } catch (error) {
      console.error('Failed to fetch manager:', error);
      toast.error('Failed to load manager');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedParent || !message.trim()) {
      toast.error('Please select a recipient and enter a message');
      return;
    }

    try {
      setLoading(true);
      const messageData = {
        toId: selectedParent.id || selectedParent._id,
        toType: recipientType,
        message: message,
        subject: subject || '',
        studentId: selectedStudent?.id || null
      };

      const response = await api.post('/driver/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Message sent successfully');
        // Reset form
        setMessage('');
        setSubject('');
        setSelectedParent(null);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Recipient Type Selector */}
      <Text>Send to:</Text>
      <Picker
        selectedValue={recipientType}
        onValueChange={(value) => {
          setRecipientType(value);
          setSelectedParent(null);
          setSelectedStudent(null);
        }}
      >
        <Picker.Item label="Parent" value="parent" />
        <Picker.Item label="Manager" value="manager" />
      </Picker>

      {/* Parent Selector */}
      {recipientType === 'parent' && (
        <>
          <Text>Select Parent:</Text>
          {loading ? (
            <Text>Loading parents...</Text>
          ) : (
            <Picker
              selectedValue={selectedParent?.id}
              onValueChange={(value) => {
                const parent = parents.find(p => p.id === value);
                setSelectedParent(parent);
                setSelectedStudent(null);
              }}
            >
              <Picker.Item label="Select Parent" value="" />
              {parents.map(parent => (
                <Picker.Item
                  key={parent.id}
                  label={`${parent.name} (${parent.students?.length || 0} students)`}
                  value={parent.id}
                />
              ))}
            </Picker>
          )}

          {/* Student Selector (Optional) */}
          {selectedParent && selectedParent.students && selectedParent.students.length > 0 && (
            <>
              <Text>Select Student (Optional):</Text>
              <Picker
                selectedValue={selectedStudent?.id}
                onValueChange={(value) => {
                  const student = selectedParent.students.find(s => s.id === value);
                  setSelectedStudent(student);
                }}
              >
                <Picker.Item label="No specific student" value="" />
                {selectedParent.students.map(student => (
                  <Picker.Item
                    key={student.id}
                    label={student.name}
                    value={student.id}
                  />
                ))}
              </Picker>
            </>
          )}
        </>
      )}

      {/* Manager Display */}
      {recipientType === 'manager' && manager && (
        <View>
          <Text>Manager: {manager.name}</Text>
          <Text>Email: {manager.email}</Text>
        </View>
      )}

      {/* Subject Input */}
      <TextInput
        placeholder="Subject (Optional)"
        value={subject}
        onChangeText={setSubject}
        style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
      />

      {/* Message Input */}
      <TextInput
        placeholder="Type your message..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={6}
        style={{ borderWidth: 1, padding: 10, marginTop: 10, textAlignVertical: 'top' }}
      />

      {/* Send Button */}
      <Button
        title={loading ? "Sending..." : "Send Message"}
        onPress={handleSend}
        disabled={loading || !selectedParent || !message.trim()}
      />
    </View>
  );
};

export default ComposeMessage;
```

---

## Testing Checklist

- [x] Routes are added to `backend/routes/driver.js`
- [x] Controller functions exist in `backend/controllers/driverController.js`
- [x] Required imports are present (Parent, Student, Manager, Route, mongoose)
- [x] `verifyDriver` middleware is implemented
- [ ] Backend server has been restarted
- [ ] GET `/api/driver/parents` returns 200 with parents list (only parents of students on route)
- [ ] GET `/api/driver/students` returns 200 with students list (only students on route)
- [ ] GET `/api/driver/parents` without route returns empty array with message
- [ ] GET `/api/driver/parents` without token returns 401
- [ ] Response format matches expected structure
- [ ] Parents include their students (only students on route)
- [ ] Students include their parents
- [ ] Mobile app can successfully load parents
- [ ] Only parents of students on driver's route are returned

---

## Important Notes

1. **Route-Based Filtering**: The API only returns parents whose children are on the driver's **current route**. If the driver has no route assigned, an empty array is returned.

2. **Student Filtering**: Only active, non-deleted students not on leave are included.

3. **Parent Filtering**: Only active parents are included.

4. **Route Assignment Methods**: The implementation handles both:
   - Students with `route` field matching driver's `currentRoute`
   - Students whose ID is in the Route's `students` array

5. **Empty Responses**: If no route is assigned or no parents are found, the API returns an empty array with an informative message, not an error.

---

## Common Issues & Solutions

### Issue: Empty Parents List

**Possible Causes**:
1. Driver has no route assigned
2. No students on the route
3. Students on route have no parents
4. Parents are not active

**Solution**:
- Check driver's `currentRoute` field
- Verify students are assigned to the route
- Check parent status (must be 'Active')
- Check student status (must not be 'Leave' and not deleted)

### Issue: 400 Error - "Driver does not have a school ID assigned"

**Solution**:
- Verify driver record has `sid` (school ID) field
- Update driver record if needed

### Issue: 401 Unauthorized

**Solution**:
- Verify JWT token is valid and not expired
- Check token format: `Bearer {token}`
- Ensure driver is logged in correctly

---

## Next Steps

1. **Restart Backend Server** (CRITICAL)
2. **Test endpoints** using Postman or cURL
3. **Integrate with mobile app**
4. **Test complete flow** from mobile app
5. **Monitor logs** for any errors

---

## API Response Examples

### Success - Parents with Students

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "photo": null,
      "status": "Active",
      "students": [
        {
          "_id": "507f191e810c19729de860ea",
          "id": "507f191e810c19729de860ea",
          "name": "Jane Doe",
          "grade": "Grade 5",
          "photo": null,
          "status": "Active"
        }
      ],
      "sid": "507f1f77bcf86cd799439012"
    }
  ]
}
```

### No Route Assigned

```json
{
  "success": true,
  "data": [],
  "message": "No route assigned to driver"
}
```

### No Parents Found

```json
{
  "success": true,
  "data": [],
  "message": "No parents found for students on your route"
}
```

---

**Implementation Complete!** ✅

All endpoints are ready. Remember to **restart the backend server** for changes to take effect.


