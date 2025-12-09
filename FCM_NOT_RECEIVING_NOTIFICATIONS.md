# FCM Notifications Sent But Not Received

## Problem

FCM API is working ✅ - logs show:
```
✅ FCM REST API: Successfully sent 1 notifications
```

But notifications are **not appearing on the phone**.

---

## Common Causes

### 1. Invalid or Expired Device Tokens (Most Common)

**The device token stored in the database might be:**
- ❌ A placeholder token (like `"device_token"`)
- ❌ An expired token
- ❌ A token from a different app/device
- ❌ A token that was revoked

**Check:**
1. Look at the device token in the database
2. Real FCM tokens are **140+ characters long**
3. Should look like: `cXyZ123abc456def789...` (long alphanumeric string)

**Fix:**
- User needs to **log in again from the mobile app**
- Mobile app should send a **real FCM token** (not placeholder)
- Token will be updated in database

---

### 2. Mobile App Not Configured for FCM

**The mobile app might not be:**
- ✅ Initialized with Firebase SDK
- ✅ Requesting notification permissions
- ✅ Handling incoming FCM messages
- ✅ Running in foreground/background

**Check Mobile App:**
1. **Firebase SDK initialized?**
   - Should initialize on app start
   - Should connect to your Firebase project

2. **Notification permissions granted?**
   - App should request permissions
   - User must grant permissions
   - Check phone settings → Apps → Your App → Notifications

3. **FCM token being retrieved?**
   - App should get token from Firebase SDK
   - Token should be sent to backend during login

4. **Message handler implemented?**
   - App should have a handler for incoming messages
   - Should display notifications when received

---

### 3. App Not Running or Background Restrictions

**Notifications might be blocked if:**
- App is force-stopped
- Battery optimization is enabled for the app
- Do Not Disturb mode is on
- App notifications are disabled in phone settings

**Check:**
1. Phone Settings → Apps → Your App → Notifications (should be ON)
2. Phone Settings → Apps → Your App → Battery → Unrestricted (if available)
3. Make sure Do Not Disturb is off
4. Try opening the app and keeping it in foreground

---

### 4. Token Mismatch

**The token in database might not match the current device token.**

**This happens when:**
- User logged in on a different device
- App was uninstalled and reinstalled
- Token was refreshed but not updated in database

**Fix:**
- User should log in again
- App should send current token to backend
- Backend will update the token

---

### 5. Wrong Firebase Project

**The mobile app might be connected to a different Firebase project.**

**Check:**
1. Mobile app's `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
2. Project ID should be: `tracktoto-7e4ce`
3. Should match the backend's `FIREBASE_PROJECT_ID`

---

## Debugging Steps

### Step 1: Verify Device Token

Check the device token in your database:

```javascript
// In MongoDB or via API
db.drivers.findOne({ email: "driver2@gmail.com" }, { deviceToken: 1 })
```

**Should be:**
- ✅ 140+ characters long
- ✅ Alphanumeric string
- ✅ NOT `"device_token"` or similar placeholder

**If it's a placeholder:**
- User needs to log in from mobile app
- App should send real token

### Step 2: Test Token Validity

The backend now logs detailed error messages. Check Render logs when sending:

**If token is invalid:**
```
❌ FCM REST API: Failed to send to token d5SFjKHdTyWyFbiNw5X...
   ⚠️  Token is invalid or expired. User needs to log in again to get a new token.
```

**If token is unregistered:**
```
❌ FCM REST API: Failed to send to token d5SFjKHdTyWyFbiNw5X...
   ⚠️  Token is unregistered (app uninstalled or token expired).
```

### Step 3: Test from Firebase Console

1. Go to [Firebase Console - Cloud Messaging](https://console.firebase.google.com/project/tracktoto-7e4ce/cloudmessaging)
2. Click **Send test message**
3. Enter the device token from your database
4. Send test message

**If this also doesn't work:**
- Token is definitely invalid
- User needs to get a new token from the app

**If this works:**
- Token is valid
- Issue is with mobile app configuration

### Step 4: Check Mobile App Logs

On the mobile device, check app logs for:
- FCM token retrieval
- Notification receipt
- Any errors

---

## Mobile App Checklist

### Android:
- [ ] Firebase SDK initialized
- [ ] `google-services.json` file added (with correct project ID)
- [ ] Notification permissions requested
- [ ] FCM token retrieved and sent to backend
- [ ] FirebaseMessagingService implemented
- [ ] Notification channel created (Android 8+)
- [ ] App has notification permission in phone settings

### iOS:
- [ ] Firebase SDK initialized
- [ ] `GoogleService-Info.plist` file added (with correct project ID)
- [ ] Notification permissions requested (APNs)
- [ ] FCM token retrieved and sent to backend
- [ ] UNUserNotificationCenter delegate implemented
- [ ] App has notification permission in phone settings

---

## Quick Test

### Test 1: Verify Token Format

Check the token in database - should be 140+ characters:
```javascript
// If token is "device_token" or similar → Invalid
// If token is 140+ chars → Might be valid
```

### Test 2: Send Test from Firebase Console

1. Copy token from database
2. Go to Firebase Console → Cloud Messaging → Send test message
3. Paste token and send

**Result:**
- ✅ Works → Token is valid, issue is with app
- ❌ Fails → Token is invalid, user needs to log in again

### Test 3: Check App Permissions

On the phone:
1. Settings → Apps → Your App → Notifications
2. Should be **ON**
3. All notification types should be enabled

---

## Most Likely Issues

1. **Token is placeholder** (`"device_token"`) → User needs to log in from mobile app
2. **Token is expired** → User needs to log in again
3. **App not configured** → Mobile app needs FCM setup
4. **Permissions not granted** → User needs to grant notification permissions

---

## Solution

### For Backend (Already Done):
- ✅ FCM API is working
- ✅ REST API v1 fallback is working
- ✅ Enhanced error logging added

### For Mobile App (Needs to be done):
1. **Get real FCM token** from Firebase SDK
2. **Send token during login** (not placeholder)
3. **Request notification permissions**
4. **Handle incoming messages**
5. **Display notifications**

See `MOBILE_APP_FCM_TOKEN_GUIDE.md` for mobile app implementation details.

---

## Next Steps

1. **Check device token in database** - is it a real token (140+ chars)?
2. **Test token in Firebase Console** - does it work?
3. **Check mobile app** - is it sending real tokens?
4. **Check phone settings** - are notifications enabled?

The backend is working correctly - the issue is likely with the device token or mobile app configuration.


