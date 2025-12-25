# Leave Request Mobile Implementation Guide

## 📱 Overview

This document describes what needs to be implemented on the mobile app for the leave request feature, including receiving notifications when managers approve/reject leave requests.

---

## ✅ Backend Implementation Status

**Status**: ✅ **FULLY IMPLEMENTED**

All backend endpoints for leave request approval/rejection and parent notifications have been implemented.

---

## 🔌 Backend Endpoints

### For Parents

#### 1. Get Parent's Leave Requests

**Endpoint**: `GET /api/parent/leave-requests`

**Authentication**: Required (JWT Bearer Token - Parent role)

**Query Parameters** (all optional):
- `studentId` (string): Filter by specific student ID
- `status` (string): Filter by status - one of: `pending`, `approved`, `rejected`
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of items per page (default: 50)

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
- `400 Bad Request`: Invalid status parameter
- `403 Forbidden`: Student does not belong to parent (when studentId filter is used)
- `404 Not Found`: Parent not found

#### 2. Request Student Leave

**Endpoint**: `POST /api/parent/students/:studentId/leave-request`

**Authentication**: Required (JWT Bearer Token - Parent role)

**Request Body**:
```json
{
  "startDate": "2024-01-20",  // Required: ISO date format (YYYY-MM-DD)
  "endDate": "2024-01-22",    // Required: ISO date format (YYYY-MM-DD)
  "reason": "Family vacation" // Optional: Reason for leave
}
```

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": "leave_request_001",
    "studentId": "student_123",
    "startDate": "2024-01-20",
    "endDate": "2024-01-22",
    "reason": "Family vacation",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields, invalid dates, or overlapping leave request
- `404 Not Found`: Student not found or does not belong to parent

#### 3. Get Student Travel History

**Endpoint**: `GET /api/parent/students/:studentId/history`

**Authentication**: Required (JWT Bearer Token - Parent role)

**Query Parameters** (all optional):
- `startDate` (string): Filter journeys from this date (ISO format)
- `endDate` (string): Filter journeys to this date (ISO format)
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of items per page (default: 20)

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Travel history retrieved successfully",
  "data": [
    {
      "id": "journey_001_picked",
      "date": "2024-01-20",
      "type": "picked",
      "time": "2024-01-20T08:30:00.000Z",
      "journeyId": "journey_001",
      "journeyType": "morning",
      "driverName": "John Driver",
      "vehicleNumber": "ABC-123"
    },
    {
      "id": "journey_001_dropped",
      "date": "2024-01-20",
      "type": "dropped",
      "time": "2024-01-20T15:30:00.000Z",
      "journeyId": "journey_001",
      "journeyType": "evening",
      "driverName": "John Driver",
      "vehicleNumber": "ABC-123"
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

**Event Types**:
- `picked`: Student was picked up
- `dropped`: Student was dropped off

**Error Responses**:
- `404 Not Found`: Student not found or does not belong to parent

---

### For Managers

#### 1. Review Leave Request (Manager)

**Endpoint**: `PUT /api/manager/leave-requests/:leaveRequestId/review`

**Authentication**: Required (JWT Bearer Token - Manager role)

**Request Body**:
```json
{
  "status": "approved",  // or "rejected"
  "reviewNotes": "Optional notes from manager"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Leave request approved successfully",
  "data": {
    "id": "leave_request_001",
    "studentId": "student_123",
    "studentName": "John Doe",
    "startDate": "2024-01-20",
    "endDate": "2024-01-22",
    "status": "approved",
    "reviewedBy": "manager_456",
    "reviewedAt": "2024-01-16T10:00:00.000Z",
    "reviewNotes": "Approved for family vacation"
  }
}
```

#### 2. Get Pending Leave Requests (Manager)

**Endpoint**: `GET /api/manager/leave-requests/pending`

**Authentication**: Required (JWT Bearer Token - Manager role)

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Pending leave requests retrieved successfully",
  "data": [
    {
      "id": "leave_request_001",
      "studentId": "student_123",
      "studentName": "John Doe",
      "studentGrade": "Grade 5",
      "parentId": "parent_789",
      "parentName": "Jane Doe",
      "parentEmail": "jane@example.com",
      "startDate": "2024-01-20",
      "endDate": "2024-01-22",
      "reason": "Family vacation",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## 🔔 Real-time Notifications (Socket.IO)

### For Parents

When a manager approves or rejects a leave request, parents receive real-time notifications via Socket.IO.

#### Notification Event Structure

**Event Name**: `notification`

**Room**: `parent:{parentId}`

**Payload for Approved Leave**:
```json
{
  "type": "leave_request_approved",
  "leaveRequestId": "leave_request_001",
  "studentId": "student_123",
  "studentName": "John Doe",
  "status": "approved",
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-22T00:00:00.000Z",
  "reviewNotes": "Approved for family vacation",
  "timestamp": "2024-01-16T10:00:00.000Z"
}
```

**Payload for Rejected Leave**:
```json
{
  "type": "leave_request_rejected",
  "leaveRequestId": "leave_request_001",
  "studentId": "student_123",
  "studentName": "John Doe",
  "status": "rejected",
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-22T00:00:00.000Z",
  "reviewNotes": "Cannot approve due to exam period",
  "timestamp": "2024-01-16T10:00:00.000Z"
}
```

---

## 📱 Mobile App Implementation Requirements

### 1. Socket.IO Connection

Ensure the parent is connected to their Socket.IO room:

```dart
// Join parent room for notifications
socket.emit('join-parent-room', { parentId: parentId });
```

### 2. Listen for Leave Request Notifications

```dart
socket.on('notification', (data) {
  if (data['type'] == 'leave_request_approved' || 
      data['type'] == 'leave_request_rejected') {
    handleLeaveRequestNotification(data);
  }
});
```

### 3. Handle Leave Request Notification

```dart
void handleLeaveRequestNotification(Map<String, dynamic> data) {
  final type = data['type'];
  final leaveRequestId = data['leaveRequestId'];
  final studentName = data['studentName'];
  final status = data['status']; // 'approved' or 'rejected'
  final startDate = data['startDate'];
  final endDate = data['endDate'];
  final reviewNotes = data['reviewNotes'] ?? '';
  final timestamp = data['timestamp'];
  
  // Show notification to user
  showNotification(
    title: status == 'approved' 
      ? '✅ Leave Request Approved' 
      : '❌ Leave Request Rejected',
    body: status == 'approved'
      ? 'Your leave request for $studentName ($startDate to $endDate) has been approved${reviewNotes.isNotEmpty ? ". Note: $reviewNotes" : ""}'
      : 'Your leave request for $studentName ($startDate to $endDate) has been rejected${reviewNotes.isNotEmpty ? ". Reason: $reviewNotes" : ""}',
    data: data
  );
  
  // Update local state/cache
  updateLeaveRequestStatus(leaveRequestId, status);
  
  // Refresh leave requests list if on that screen
  refreshLeaveRequestsList();
}
```

### 4. FCM Push Notifications

The backend automatically sends FCM push notifications. Handle them in your FCM handler:

```dart
// In your FCM message handler
void handleFCMNotification(RemoteMessage message) {
  final data = message.data;
  final type = data['type'];
  
  if (type == 'leave_request_approved' || type == 'leave_request_rejected') {
    // Navigate to leave requests screen or show notification
    navigateToLeaveRequests();
    
    // Show local notification
    showLocalNotification(
      title: message.notification?.title ?? 
        (type == 'leave_request_approved' 
          ? '✅ Leave Request Approved' 
          : '❌ Leave Request Rejected'),
      body: message.notification?.body ?? '',
      payload: data
    );
  }
}
```

### 5. Update Leave Request Status in UI

When a notification is received, update the leave request status in your local state:

```dart
void updateLeaveRequestStatus(String leaveRequestId, String status) {
  // Update in local state
  setState(() {
    final request = leaveRequests.firstWhere(
      (req) => req.id == leaveRequestId
    );
    if (request != null) {
      request.status = status;
    }
  });
  
  // Optionally refresh from server
  fetchLeaveRequests();
}
```

### 6. Display Leave Request Status

Update your leave request list/item UI to show the status:

```dart
Widget buildLeaveRequestItem(LeaveRequest request) {
  return ListTile(
    title: Text('${request.studentName} - ${formatDateRange(request.startDate, request.endDate)}'),
    subtitle: Text(request.reason ?? 'No reason provided'),
    trailing: _buildStatusBadge(request.status),
    onTap: () => navigateToLeaveRequestDetails(request),
  );
}

Widget _buildStatusBadge(String status) {
  Color color;
  String text;
  
  switch (status) {
    case 'pending':
      color = Colors.orange;
      text = 'Pending';
      break;
    case 'approved':
      color = Colors.green;
      text = 'Approved';
      break;
    case 'rejected':
      color = Colors.red;
      text = 'Rejected';
      break;
    default:
      color = Colors.grey;
      text = 'Unknown';
  }
  
  return Container(
    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: color.withOpacity(0.2),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color),
    ),
    child: Text(
      text,
      style: TextStyle(color: color, fontWeight: FontWeight.bold),
    ),
  );
}
```

---

## 📋 Mobile App Features to Implement

### For Parents:

1. ✅ **Request Leave** (Already implemented)
   - Submit leave request with dates and reason
   - View pending leave requests

2. 🆕 **Receive Approval/Rejection Notifications**
   - Listen for Socket.IO notifications
   - Handle FCM push notifications
   - Show in-app notifications/banners
   - Update leave request status in real-time

3. 🆕 **View Leave Request History**
   - Display all leave requests (pending, approved, rejected)
   - Show review notes from manager
   - Filter by status
   - Show dates and student name

4. 🆕 **Leave Request Details Screen**
   - Show full leave request details
   - Display review notes if reviewed
   - Show manager's decision timestamp

### For Managers (if implementing manager mobile app):

1. 🆕 **View Pending Leave Requests**
   - List all pending leave requests for their school
   - Show student name, parent name, dates, reason

2. 🆕 **Approve/Reject Leave Requests**
   - Approve or reject leave requests
   - Add optional review notes
   - See student and parent information

---

## 🔔 Notification Types Reference

The following notification types are used:

- `leave_request` - New leave request created (sent to manager)
- `leave_request_approved` - Leave request approved (sent to parent)
- `leave_request_rejected` - Leave request rejected (sent to parent)

---

## 📱 Example Implementation (Flutter/Dart)

### Complete Notification Handler

```dart
class LeaveRequestNotificationHandler {
  final Socket socket;
  final Function(String, Map<String, dynamic>) onNotification;
  
  LeaveRequestNotificationHandler({
    required this.socket,
    required this.onNotification,
  }) {
    _setupListeners();
  }
  
  void _setupListeners() {
    socket.on('notification', (data) {
      final type = data['type'] as String?;
      
      if (type == 'leave_request_approved' || 
          type == 'leave_request_rejected') {
        onNotification(type!, data);
      }
    });
  }
  
  void joinParentRoom(String parentId) {
    socket.emit('join-parent-room', {'parentId': parentId});
  }
}
```

### Complete API Integration Example

```dart
// Leave Request Model
class LeaveRequest {
  final String id;
  final String studentId;
  final String studentName;
  final String studentGrade;
  final String? studentPhoto;
  final String startDate;
  final String endDate;
  final String reason;
  final String status; // 'pending', 'approved', 'rejected'
  final Reviewer? reviewedBy;
  final DateTime? reviewedAt;
  final String? reviewNotes;
  final DateTime createdAt;
  final DateTime updatedAt;

  LeaveRequest({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentGrade,
    this.studentPhoto,
    required this.startDate,
    required this.endDate,
    required this.reason,
    required this.status,
    this.reviewedBy,
    this.reviewedAt,
    this.reviewNotes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentGrade: json['studentGrade'] as String,
      studentPhoto: json['studentPhoto'] as String?,
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      reason: json['reason'] as String,
      status: json['status'] as String,
      reviewedBy: json['reviewedBy'] != null
          ? Reviewer.fromJson(json['reviewedBy'] as Map<String, dynamic>)
          : null,
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'] as String)
          : null,
      reviewNotes: json['reviewNotes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

class Reviewer {
  final String id;
  final String name;

  Reviewer({required this.id, required this.name});

  factory Reviewer.fromJson(Map<String, dynamic> json) {
    return Reviewer(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}
```

### Usage in Parent Screen

```dart
class ParentLeaveRequestsScreen extends StatefulWidget {
  @override
  _ParentLeaveRequestsScreenState createState() => 
      _ParentLeaveRequestsScreenState();
}

class _ParentLeaveRequestsScreenState extends State<ParentLeaveRequestsScreen> {
  List<LeaveRequest> leaveRequests = [];
  bool isLoading = false;
  String? errorMessage;
  final notificationHandler = LeaveRequestNotificationHandler(
    socket: socket,
    onNotification: (type, data) {
      // Update UI when notification received
      _handleLeaveRequestNotification(type, data);
    },
  );
  
  @override
  void initState() {
    super.initState();
    _loadLeaveRequests();
    notificationHandler.joinParentRoom(currentParentId);
  }
  
  void _handleLeaveRequestNotification(String type, Map<String, dynamic> data) {
    setState(() {
      final requestId = data['leaveRequestId'] as String;
      final status = data['status'] as String;
      
      final index = leaveRequests.indexWhere(
        (req) => req.id == requestId
      );
      
      if (index != -1) {
        leaveRequests[index].status = status;
        leaveRequests[index].reviewNotes = data['reviewNotes'] as String?;
        leaveRequests[index].reviewedAt = DateTime.parse(data['timestamp']);
      }
    });
    
    // Show snackbar or dialog
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          type == 'leave_request_approved'
            ? '✅ Leave request approved!'
            : '❌ Leave request rejected'
        ),
        backgroundColor: type == 'leave_request_approved' 
          ? Colors.green 
          : Colors.red,
      ),
    );
  }
  
  Future<void> _loadLeaveRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/parent/leave-requests'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          leaveRequests = (data['data'] as List)
              .map((item) => LeaveRequest.fromJson(item))
              .toList();
        });
      } else {
        // Handle error
        print('Failed to load leave requests: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading leave requests: $e');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Leave Requests')),
      body: ListView.builder(
        itemCount: leaveRequests.length,
        itemBuilder: (context, index) {
          return _buildLeaveRequestItem(leaveRequests[index]);
        },
      ),
    );
  }
  
  Widget _buildLeaveRequestItem(LeaveRequest request) {
    // Build leave request item widget
  }
}
```

---

## 📱 Travel History API Integration

### Example: Fetching Student Travel History

```dart
class TravelHistoryScreen extends StatefulWidget {
  final String studentId;
  
  TravelHistoryScreen({required this.studentId});

  @override
  _TravelHistoryScreenState createState() => _TravelHistoryScreenState();
}

class _TravelHistoryScreenState extends State<TravelHistoryScreen> {
  List<TravelEvent> travelHistory = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadTravelHistory();
  }

  Future<void> _loadTravelHistory({
    String? startDate,
    String? endDate,
    int page = 1,
  }) async {
    setState(() => isLoading = true);
    
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': '20',
      };
      
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      
      final uri = Uri.parse(
        '$baseUrl/api/parent/students/${widget.studentId}/history'
      ).replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          travelHistory = (data['data'] as List)
              .map((item) => TravelEvent.fromJson(item))
              .toList();
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = 'Failed to load travel history';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Travel History')),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : travelHistory.isEmpty
              ? Center(child: Text('No travel history found'))
              : ListView.builder(
                  itemCount: travelHistory.length,
                  itemBuilder: (context, index) {
                    final event = travelHistory[index];
                    return ListTile(
                      leading: Icon(
                        event.type == 'picked' ? Icons.arrow_upward : Icons.arrow_downward,
                        color: event.type == 'picked' ? Colors.green : Colors.blue,
                      ),
                      title: Text(
                        event.type == 'picked' ? 'Picked Up' : 'Dropped Off'
                      ),
                      subtitle: Text(
                        '${formatDateTime(event.time)}\n'
                        'Driver: ${event.driverName}\n'
                        'Vehicle: ${event.vehicleNumber}'
                      ),
                    );
                  },
                ),
    );
  }
}

class TravelEvent {
  final String id;
  final String date;
  final String type; // 'picked' or 'dropped'
  final DateTime time;
  final String? journeyId;
  final String? journeyType;
  final String driverName;
  final String vehicleNumber;

  TravelEvent({
    required this.id,
    required this.date,
    required this.type,
    required this.time,
    this.journeyId,
    this.journeyType,
    required this.driverName,
    required this.vehicleNumber,
  });

  factory TravelEvent.fromJson(Map<String, dynamic> json) {
    return TravelEvent(
      id: json['id'] as String,
      date: json['date'] as String,
      type: json['type'] as String,
      time: DateTime.parse(json['time'] as String),
      journeyId: json['journeyId'] as String?,
      journeyType: json['journeyType'] as String?,
      driverName: json['driverName'] as String,
      vehicleNumber: json['vehicleNumber'] as String,
    );
  }
}
```

---

## 🧪 Testing

### Test Cases for Mobile App

1. ✅ Receive Socket.IO notification when leave is approved
2. ✅ Receive Socket.IO notification when leave is rejected
3. ✅ Receive FCM push notification when leave is approved
4. ✅ Receive FCM push notification when leave is rejected
5. ✅ Update leave request status in UI when notification received
6. ✅ Show notification banner/alert when notification received
7. ✅ Navigate to leave requests screen when notification tapped
8. ✅ Display review notes in leave request details

---

## 📝 Notes

1. **Socket.IO Connection**: Ensure parent is connected to Socket.IO and has joined their parent room before expecting notifications.

2. **FCM Tokens**: Ensure parent's device token is registered with the backend (usually done during login).

3. **Offline Handling**: If the app is offline when a notification is sent, it will be received when the app comes back online (FCM handles this automatically).

4. **Notification Persistence**: Consider storing notifications locally so users can see them even after closing the app.

5. **Status Updates**: When a leave request is approved, the student's status is automatically updated to 'Leave' in the backend. The mobile app should reflect this change.

---

## 🚀 Next Steps

1. Implement Socket.IO notification listener for leave request approvals/rejections
2. Implement FCM notification handler for leave request notifications
3. Update leave request UI to show status changes in real-time
4. Add leave request history screen (if not already implemented)
5. Test notification flow end-to-end

---

**Last Updated**: 2024-01-16

**Status**: ✅ Backend Ready - Mobile Implementation Required

