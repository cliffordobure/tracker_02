# Parent Leave Requests API Documentation

## Endpoint Details

### Get Parent's Leave Requests

**Endpoint**: `GET /api/parent/leave-requests`

**Full URL**: `https://your-backend-url.com/api/parent/leave-requests`

**Authentication**: Required (JWT Bearer Token in Authorization header)

**Method**: GET

**Query Parameters** (all optional):
- `studentId` (string): Filter leave requests by specific student ID
- `status` (string): Filter by status - one of: `pending`, `approved`, `rejected`
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of items per page (default: 50, max: 100)

**Example Request**:
```bash
curl -X GET "https://your-backend-url.com/api/parent/leave-requests?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example Request (Filter by Student)**:
```bash
curl -X GET "https://your-backend-url.com/api/parent/leave-requests?studentId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Leave requests retrieved successfully",
  "data": [
    {
      "id": "leave_request_001",
      "studentId": "student_123",
      "studentName": "John Doe",
      "studentGrade": "Grade 5",
      "studentPhoto": "https://example.com/photo.jpg",
      "startDate": "2024-01-20",
      "endDate": "2024-01-22",
      "reason": "Family vacation",
      "status": "approved",
      "reviewedBy": {
        "id": "manager_456",
        "name": "Manager Name"
      },
      "reviewedAt": "2024-01-16T10:00:00.000Z",
      "reviewNotes": "Approved for family vacation",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

**Error Responses**:

- `400 Bad Request` - Invalid status parameter:
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: pending, approved, rejected"
}
```

- `401 Unauthorized` - Missing or invalid token:
```json
{
  "message": "Access denied. No token provided."
}
```

- `403 Forbidden` - Student does not belong to parent (when studentId filter is used):
```json
{
  "success": false,
  "message": "Access denied. Student does not belong to you."
}
```

- `404 Not Found` - Parent not found:
```json
{
  "success": false,
  "message": "Parent not found"
}
```

- `500 Internal Server Error` - Server error:
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details"
}
```

## Troubleshooting 404 Errors

If you're getting a 404 error, check the following:

1. **Verify the URL is correct**:
   - Full URL should be: `/api/parent/leave-requests`
   - NOT `/api/parent/leave-request` (missing 's')
   - NOT `/api/parent/students/leave-requests`
   - NOT `/api/parent/leave-requests/` (trailing slash might cause issues)

2. **Verify Authentication**:
   - Make sure you're sending the JWT token in the Authorization header
   - Format: `Authorization: Bearer YOUR_TOKEN_HERE`
   - Verify the token is valid and not expired

3. **Verify User Role**:
   - The endpoint requires the user to be a parent
   - Make sure you're logged in as a parent, not a manager, driver, or teacher

4. **Check Server Status**:
   - Ensure the backend server is running
   - Verify the route is registered (check server logs)
   - Restart the server if you just added this endpoint

5. **Check Network/Proxy**:
   - Verify you're calling the correct backend URL
   - Check if there are any proxy or firewall rules blocking the request
   - Verify CORS is configured correctly on the backend

## Mobile App Implementation Example

### Flutter/Dart Example:
```dart
Future<List<LeaveRequest>> fetchLeaveRequests({
  String? studentId,
  String? status,
  int page = 1,
  int limit = 50,
}) async {
  try {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (studentId != null) queryParams['studentId'] = studentId;
    if (status != null) queryParams['status'] = status;
    
    final uri = Uri.parse('$baseUrl/api/parent/leave-requests')
        .replace(queryParameters: queryParams);
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((item) => LeaveRequest.fromJson(item))
          .toList();
    } else if (response.statusCode == 404) {
      throw Exception('Endpoint not found. Please check the URL.');
    } else {
      throw Exception('Failed to load leave requests: ${response.statusCode}');
    }
  } catch (e) {
    print('Error fetching leave requests: $e');
    rethrow;
  }
}
```

### React Native Example:
```javascript
const fetchLeaveRequests = async (filters = {}) => {
  try {
    const { studentId, status, page = 1, limit = 50 } = filters;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (studentId) queryParams.append('studentId', studentId);
    if (status) queryParams.append('status', status);
    
    const response = await fetch(
      `${BASE_URL}/api/parent/leave-requests?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.data;
    } else if (response.status === 404) {
      throw new Error('Endpoint not found. Please verify the URL.');
    } else {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};
```

## Related Endpoints

- **Create Leave Request**: `POST /api/parent/students/:studentId/leave-request`
- **Get Travel History**: `GET /api/parent/students/:studentId/history`
- **Activate Student**: `POST /api/parent/students/:studentId/activate`

---

**Last Updated**: 2024-01-16
**Status**: ✅ Implemented and Ready


