# FCM REST API v1 Workaround

## Problem

Firebase Admin SDK is trying to use the legacy `/batch` endpoint which returns 404, even though:
- ✅ API is enabled
- ✅ Permissions are correct
- ✅ Billing is enabled
- ✅ Diagnostics pass

## Solution: Automatic Fallback to REST API v1

I've implemented an automatic fallback that:
1. **First tries** Firebase Admin SDK (normal method)
2. **If it fails with 404 on /batch**, automatically falls back to **FCM REST API v1** directly
3. Uses the new API endpoint: `https://fcm.googleapis.com/v1/projects/{project}/messages:send`

This bypasses the SDK's endpoint selection and uses the correct v1 API.

---

## How It Works

When you send a notification:

1. **First attempt**: Uses Firebase Admin SDK `sendMulticast()`
2. **If error**: Checks if it's a 404 on `/batch` endpoint
3. **Fallback**: Automatically uses REST API v1 directly
4. **Result**: Notifications are sent successfully

---

## What Changed

### Automatic Fallback

The code now:
- Detects when SDK uses legacy `/batch` endpoint
- Automatically switches to REST API v1
- Uses proper authentication (access tokens)
- Sends to the correct v1 endpoint

### Enhanced Logging

You'll see in logs:
- `⚠️ SDK using legacy /batch endpoint failed. Trying REST API v1 directly...`
- `✅ FCM REST API: Successfully sent X notifications`

---

## Testing

After redeploying:

1. **Try sending a notification** (driver marks student as boarded)
2. **Check logs** - should see:
   - Either: `✅ FCM: Successfully sent X notifications` (SDK worked)
   - Or: `⚠️ SDK using legacy /batch endpoint failed. Trying REST API v1 directly...` followed by `✅ FCM REST API: Successfully sent X notifications`

3. **Notifications should work** regardless of which method is used

---

## Why This Works

The REST API v1 endpoint (`/v1/projects/{project}/messages:send`) is:
- ✅ Always available when FCM API is enabled
- ✅ Doesn't rely on SDK's endpoint selection
- ✅ Uses proper authentication
- ✅ Works even if SDK has issues

---

## Manual Testing

You can also test the REST API directly:

```bash
# Get access token (from service account)
# Then call:
curl -X POST https://fcm.googleapis.com/v1/projects/tracktoto-7e4ce/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "DEVICE_TOKEN",
      "notification": {
        "title": "Test",
        "body": "Test message"
      }
    }
  }'
```

---

## Expected Behavior

### Before Fix:
```
❌ Firebase Cloud Messaging API Error (404): /batch not found
```

### After Fix:
```
⚠️ SDK using legacy /batch endpoint failed. Trying REST API v1 directly...
✅ FCM REST API: Successfully sent 1 notifications
```

Or if SDK works:
```
✅ FCM: Successfully sent 1 notifications
```

---

## Benefits

1. **Automatic**: No manual intervention needed
2. **Reliable**: Uses the correct v1 API endpoint
3. **Backward Compatible**: Still tries SDK first
4. **Transparent**: Logs show which method was used

---

## Next Steps

1. **Redeploy** your service on Render
2. **Test** by sending a notification
3. **Check logs** to see which method was used
4. **Verify** notifications are received

The workaround should handle the `/batch` endpoint issue automatically!

