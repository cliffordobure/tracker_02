# Messaging FCM Notifications Documentation

## 📱 Overview

This document describes all FCM (Firebase Cloud Messaging) push notifications sent when messages are exchanged between parents, managers, and drivers in the TrackToto application.

---

## 🔔 Notification Scenarios

### 1. Manager Sends Message to Parent

**Trigger**: Manager sends a new message to a parent

**Endpoint**: `POST /api/manager/messages`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Message",
    "body": "💬 New message from [Manager Name] about [Student Name]"
  },
  "data": {
    "type": "message",
    "messageId": "message_id_123",
    "fromId": "manager_id_456",
    "fromName": "Manager Name",
    "fromType": "manager",
    "subject": "Message subject",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `parent:{parentId}` room with event `notification`

---

### 2. Manager Replies to Parent Message

**Trigger**: Manager replies to a message from a parent

**Endpoint**: `POST /api/manager/messages/:id/reply`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Reply",
    "body": "💬 Reply from [Manager Name]"
  },
  "data": {
    "type": "message",
    "messageId": "reply_id_123",
    "fromId": "manager_id_456",
    "fromName": "Manager Name",
    "fromType": "manager",
    "subject": "Re: [Original Subject]",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `parent:{parentId}` room with event `notification`

---

### 3. Driver Sends Message to Parent

**Trigger**: Driver sends a new message to a parent

**Endpoint**: `POST /api/driver/messages`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Message",
    "body": "💬 New message from [Driver Name] about [Student Name]"
  },
  "data": {
    "type": "message",
    "messageId": "message_id_123",
    "fromId": "driver_id_456",
    "fromName": "Driver Name",
    "fromType": "driver",
    "subject": "Message subject",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `parent:{parentId}` room with event `notification`

---

### 4. Driver Replies to Parent Message

**Trigger**: Driver replies to a message from a parent

**Endpoint**: `POST /api/driver/messages/:id/reply`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Reply",
    "body": "💬 Reply from [Driver Name]"
  },
  "data": {
    "type": "message",
    "messageId": "reply_id_123",
    "fromId": "driver_id_456",
    "fromName": "Driver Name",
    "fromType": "driver",
    "subject": "Re: [Original Subject]",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `parent:{parentId}` room with event `notification`

---

### 5. Driver Sends Message to Manager

**Trigger**: Driver sends a new message to a manager

**Endpoint**: `POST /api/driver/messages`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Message",
    "body": "💬 New message from [Driver Name]"
  },
  "data": {
    "type": "message",
    "messageId": "message_id_123",
    "fromId": "driver_id_456",
    "fromName": "Driver Name",
    "fromType": "driver",
    "subject": "Message subject",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `manager:{managerId}` room with event `notification`

---

### 6. Parent Sends Message to Driver

**Trigger**: Parent sends a new message to a driver

**Endpoint**: `POST /api/parent/messages/driver`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Message",
    "body": "💬 New message from [Parent Name] about [Student Name]"
  },
  "data": {
    "type": "message",
    "messageId": "message_id_123",
    "fromId": "parent_id_456",
    "fromName": "Parent Name",
    "fromType": "parent",
    "subject": "Message subject",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `driver:{driverId}` room with event `notification`

---

### 7. Parent Replies to Manager Message

**Trigger**: Parent replies to a message from a manager

**Endpoint**: `POST /api/parent/messages/:messageId/reply`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Reply",
    "body": "💬 Reply from [Parent Name]"
  },
  "data": {
    "type": "message",
    "messageId": "reply_id_123",
    "fromId": "parent_id_456",
    "fromName": "Parent Name",
    "fromType": "parent",
    "subject": "Re: [Original Subject]",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `manager:{managerId}` room with event `notification`

---

### 8. Parent Replies to Driver Message

**Trigger**: Parent replies to a message from a driver

**Endpoint**: `POST /api/parent/messages/:messageId/reply`

**FCM Notification Payload**:
```json
{
  "notification": {
    "title": "💬 New Reply",
    "body": "💬 Reply from [Parent Name]"
  },
  "data": {
    "type": "message",
    "messageId": "reply_id_123",
    "fromId": "parent_id_456",
    "fromName": "Parent Name",
    "fromType": "parent",
    "subject": "Re: [Original Subject]",
    "studentId": "student_id_789"
  }
}
```

**Socket.IO Event**: Also sent to `driver:{driverId}` room with event `notification`

---

## 📱 Mobile App Implementation Guide

### Flutter/Dart Example

#### 1. Handle FCM Messages

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class MessageNotificationHandler {
  // Handle foreground messages
  static Future<void> handleForegroundMessage(RemoteMessage message) async {
    final data = message.data;
    final type = data['type'];
    
    if (type == 'message') {
      handleMessageNotification(data, message);
    }
  }
  
  // Handle background messages
  static Future<void> handleBackgroundMessage(RemoteMessage message) async {
    final data = message.data;
    final type = data['type'];
    
    if (type == 'message') {
      // Navigate to messages screen or show notification
      handleMessageNotification(data, message);
    }
  }
  
  static void handleMessageNotification(Map<String, dynamic> data, RemoteMessage message) {
    final messageId = data['messageId'];
    final fromType = data['fromType'];
    final fromName = data['fromName'];
    final subject = data['subject'];
    
    // Show local notification
    showLocalNotification(
      title: message.notification?.title ?? '💬 New Message',
      body: message.notification?.body ?? subject,
      payload: jsonEncode(data),
    );
    
    // Navigate to messages screen if app is open
    if (AppNavigator.isAppOpen()) {
      AppNavigator.navigateToMessage(messageId);
    }
  }
}

// Setup FCM listeners
void setupFCMListeners() {
  FirebaseMessaging.onMessage.listen(MessageNotificationHandler.handleForegroundMessage);
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    MessageNotificationHandler.handleMessageNotification(
      message.data,
      message
    );
  });
}
```

#### 2. Handle Socket.IO Notifications

```dart
import 'package:socket_io_client/socket_io_client.dart';

class SocketNotificationHandler {
  final Socket socket;
  
  SocketNotificationHandler(this.socket) {
    _setupListeners();
  }
  
  void _setupListeners() {
    socket.on('notification', (data) {
      final type = data['type'];
      
      if (type == 'message') {
        handleMessageNotification(data);
      }
    });
  }
  
  void handleMessageNotification(Map<String, dynamic> data) {
    final messageId = data['messageId'];
    final fromType = data['fromType'];
    final fromName = data['fromName'];
    final subject = data['subject'];
    
    // Update local message state
    MessageService.refreshMessages();
    
    // Show in-app notification
    showInAppNotification(
      title: '💬 New Message',
      body: '$fromName: $subject',
      onTap: () => AppNavigator.navigateToMessage(messageId),
    );
  }
  
  void joinRoom(String roomType, String userId) {
    socket.emit('join-${roomType}-room', {'${roomType}Id': userId});
  }
}

// Usage
void setupSocketNotifications() {
  final socket = SocketIO.connect(SERVER_URL);
  final handler = SocketNotificationHandler(socket);
  
  // Join parent room
  handler.joinRoom('parent', currentParentId);
  
  // Join driver room
  handler.joinRoom('driver', currentDriverId);
  
  // Join manager room
  handler.joinRoom('manager', currentManagerId);
}
```

### React Native Example

```javascript
import messaging from '@react-native-firebase/messaging';
import io from 'socket.io-client';

class MessageNotificationHandler {
  constructor() {
    this.setupFCMListeners();
    this.setupSocketListeners();
  }
  
  setupFCMListeners() {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      const { data, notification } = remoteMessage;
      
      if (data.type === 'message') {
        this.handleMessageNotification(data, notification);
      }
    });
    
    // Handle background/quit state messages
    messaging().onNotificationOpenedApp(remoteMessage => {
      const { data } = remoteMessage;
      if (data.type === 'message') {
        this.navigateToMessage(data.messageId);
      }
    });
    
    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          const { data } = remoteMessage;
          if (data.type === 'message') {
            this.navigateToMessage(data.messageId);
          }
        }
      });
  }
  
  setupSocketListeners() {
    const socket = io(SERVER_URL);
    
    socket.on('notification', (data) => {
      if (data.type === 'message') {
        this.handleSocketMessageNotification(data);
      }
    });
    
    // Join rooms
    socket.emit('join-parent-room', { parentId: currentParentId });
    socket.emit('join-driver-room', { driverId: currentDriverId });
    socket.emit('join-manager-room', { managerId: currentManagerId });
  }
  
  handleMessageNotification(data, notification) {
    // Show local notification
    this.showLocalNotification({
      title: notification?.title || '💬 New Message',
      body: notification?.body || data.subject,
      data: data,
    });
    
    // Update message list
    MessageService.refreshMessages();
  }
  
  handleSocketMessageNotification(data) {
    // Update message list in real-time
    MessageService.refreshMessages();
    
    // Show in-app notification
    this.showInAppNotification({
      title: '💬 New Message',
      body: `${data.fromName}: ${data.subject}`,
      onPress: () => this.navigateToMessage(data.messageId),
    });
  }
  
  navigateToMessage(messageId) {
    // Navigate to message detail screen
    NavigationService.navigate('MessageDetail', { messageId });
  }
}

// Initialize
const messageHandler = new MessageNotificationHandler();
```

---

## 🔧 Data Fields Reference

### Common Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | String | Always `"message"` for message notifications |
| `messageId` | String | ID of the message |
| `fromId` | String | ID of the sender |
| `fromName` | String | Name of the sender |
| `fromType` | String | Type of sender: `"parent"`, `"manager"`, or `"driver"` |
| `subject` | String | Message subject |
| `studentId` | String (optional) | Student ID if message is about a specific student |

### Notification Titles

- New Messages: `"💬 New Message"`
- Replies: `"💬 New Reply"`

### Notification Body Format

- New Message: `"💬 New message from [Sender Name] about [Student Name]"` (if studentId present)
- New Message: `"💬 New message from [Sender Name]"` (if no studentId)
- Reply: `"💬 Reply from [Sender Name]"`

---

## 🚀 Implementation Checklist

### For Mobile App Developers

- [ ] Setup Firebase Cloud Messaging (FCM)
- [ ] Handle foreground FCM messages
- [ ] Handle background FCM messages
- [ ] Handle notification taps (app opened from notification)
- [ ] Setup Socket.IO connection
- [ ] Join appropriate rooms (parent/driver/manager)
- [ ] Listen for Socket.IO notification events
- [ ] Show local notifications when message received
- [ ] Update message list in real-time
- [ ] Navigate to message detail screen when notification tapped
- [ ] Handle notification permissions

### For Backend (Already Implemented ✅)

- [x] FCM notifications sent when manager sends message to parent
- [x] FCM notifications sent when manager replies to parent
- [x] FCM notifications sent when driver sends message to parent
- [x] FCM notifications sent when driver replies to parent
- [x] FCM notifications sent when driver sends message to manager
- [x] FCM notifications sent when parent sends message to driver
- [x] FCM notifications sent when parent replies to manager
- [x] FCM notifications sent when parent replies to driver
- [x] Socket.IO notifications sent for all message scenarios

---

## 📝 Notes

1. **Device Tokens**: FCM notifications are only sent if the recipient has a valid `deviceToken` stored in their user record (Parent, Driver, or Manager model).

2. **Dual Notifications**: Both FCM and Socket.IO notifications are sent simultaneously for redundancy. The mobile app should handle both but can prioritize one over the other.

3. **Error Handling**: If FCM notification fails, the request does not fail. Errors are logged but the message is still saved and Socket.IO notification is still sent.

4. **Student Context**: If a message is about a specific student, the `studentId` field is included in the notification data, allowing the mobile app to filter or highlight messages related to specific students.

5. **Notification Persistence**: FCM handles offline delivery automatically. If a device is offline, notifications will be delivered when it comes back online.

---

**Last Updated**: 2024-01-16
**Status**: ✅ Fully Implemented - Mobile App Implementation Required



