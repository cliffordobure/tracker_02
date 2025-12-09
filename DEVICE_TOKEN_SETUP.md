# Device Token Setup Guide

## Problem

Parents and drivers created by managers don't have device tokens, so they won't receive FCM push notifications.

## Solution

Device tokens are set when users log in from the mobile app. Here's how to handle this:

---

## How Device Tokens Work

1. **Mobile App Login**: When a user logs in from the mobile app, they send their FCM device token
2. **Backend Storage**: The backend saves the token to the user's profile (`deviceToken` field)
3. **Notifications**: When notifications are sent, the backend uses stored tokens

---

## Current Behavior

### ✅ What Works:
- Notifications are **always saved to database** (even without tokens)
- Socket.io notifications work (for web users)
- API responses succeed (even if FCM fails)

### ⚠️ What Doesn't Work:
- FCM push notifications won't be sent if:
  - User doesn't have a `deviceToken`
  - User hasn't logged in from mobile app yet
  - Token is expired/invalid

---

## For Managers Creating Users

### When Creating Parents/Drivers:

Managers create users through the web dashboard. These users **won't have device tokens** until they:
1. Log in from the mobile app
2. The mobile app sends their device token during login

### This is Normal Behavior!

- ✅ Users can be created without tokens
- ✅ Notifications are saved to database
- ✅ Users will receive notifications once they log in from mobile app
- ✅ Web users can see notifications in the dashboard

---

## Mobile App Integration

### Parent/Driver Login Endpoint

The login endpoints already support device tokens:

**Parent Login:**
```http
POST /api/auth/parent/login
{
  "email": "hamilton@gmail.com",
  "password": "password",
  "deviceToken": "fcm_device_token_from_mobile_app"
}
```

**Driver Login:**
```http
POST /api/auth/driver/login
{
  "email": "driver@school.com",
  "password": "password",
  "deviceToken": "fcm_device_token_from_mobile_app"
}
```

The backend automatically saves the `deviceToken` to the user's profile.

---

## Update Device Token

Users can also update their device token via profile update:

**Parent:**
```http
PUT /api/parent/profile
{
  "deviceToken": "new_fcm_token"
}
```

**Driver:**
```http
PUT /api/driver/profile
{
  "deviceToken": "new_fcm_token"
}
```

---

## Testing Without Mobile App

If you want to test FCM without the mobile app:

1. **Get a test device token:**
   - Use Firebase Console → Cloud Messaging → Send test message
   - Or use a test token from your mobile app

2. **Update user manually:**
   ```javascript
   // In MongoDB or via API
   db.parents.updateOne(
     { email: "hamilton@gmail.com" },
     { $set: { deviceToken: "test_token_here" } }
   )
   ```

3. **Or use the profile update endpoint** (if implemented for drivers)

---

## Logging

The backend now logs helpful messages:

### When No Tokens Found:
```
ℹ️  No device tokens found for Student3's parents. Notifications saved to database.
```

### When FCM API Not Enabled:
```
⚠️  FCM API not enabled. Notifications saved to database but push notifications disabled.
```

### When Tokens Exist:
```
✅ FCM: Successfully sent 1 notifications
```

---

## Best Practices

1. **Don't require device tokens** for user creation
2. **Always save notifications** to database (even without tokens)
3. **Send tokens during login** from mobile app
4. **Handle missing tokens gracefully** (already implemented)
5. **Update tokens** when they change (FCM tokens can expire)

---

## Current Implementation Status

✅ **Already Implemented:**
- Device token storage in user profiles
- Token collection during login
- Graceful handling of missing tokens
- Database notifications always saved
- Socket.io notifications for web users

⚠️ **Needs Mobile App:**
- Mobile app must send device token during login
- Mobile app must request notification permissions
- Mobile app must handle FCM token refresh

---

## Summary

**For Managers:**
- ✅ Create users normally (tokens not required)
- ✅ Users will get tokens when they log in from mobile app
- ✅ Notifications are saved and will be delivered when tokens are available

**For Mobile App Developers:**
- ✅ Send `deviceToken` in login request
- ✅ Update token when it changes
- ✅ Request notification permissions

**For Backend:**
- ✅ Handles missing tokens gracefully
- ✅ Always saves notifications to database
- ✅ Sends FCM when tokens are available
- ✅ Logs helpful messages for debugging

---

## Troubleshooting

### "No device tokens found" message?
- ✅ This is normal for users who haven't logged in from mobile app yet
- ✅ Notifications are still saved to database
- ✅ Users can see notifications when they log in

### FCM 404 Error?
- ⚠️ This is a different issue - Cloud Messaging API not enabled
- See `FCM_404_ERROR_FIX.md` for solution

### Notifications not received?
1. Check if user has `deviceToken` in database
2. Check if token is valid (not expired)
3. Check if FCM API is enabled
4. Check mobile app has notification permissions

