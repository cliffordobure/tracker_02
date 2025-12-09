# FCM 404 Error - /batch Endpoint Issue

## Problem

You're getting 404 errors on the `/batch` endpoint. This is the **legacy FCM API endpoint** that's being deprecated.

The error shows:
```
The requested URL /batch was not found on this server
```

This means Firebase Admin SDK is trying to use the old API endpoint.

---

## Root Cause

The Firebase Admin SDK is trying to use the legacy FCM API (`/batch`) instead of the new FCM API v1 (`/v1/projects/{project}/messages:send`).

This can happen when:
1. The project hasn't been migrated to the new FCM API
2. The service account doesn't have access to the new API
3. There's a configuration mismatch

---

## Solution 1: Enable FCM API v1 Explicitly

The new FCM API might need to be enabled separately:

1. Go to [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library?project=tracktoto-7e4ce)
2. Search for **"FCM API"** (not just "Firebase Cloud Messaging API")
3. Enable **"FCM API"** if it's separate
4. Also enable **"Firebase Cloud Messaging API"** if not already enabled

**Note:** There might be two APIs:
- `Firebase Cloud Messaging API` (legacy)
- `FCM API` (new v1 API)

Enable both to be safe.

---

## Solution 2: Check Firebase Project Configuration

The project might need to be configured for the new API:

1. Go to [Firebase Console](https://console.firebase.google.com/project/tracktoto-7e4ce/settings/general)
2. Check **Project Settings**
3. Look for any migration prompts or warnings
4. Complete any setup steps

---

## Solution 3: Verify Service Account Has FCM v1 Permissions

The service account might need explicit FCM v1 permissions:

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=tracktoto-7e4ce)
2. Find: `firebase-adminsdk-fbsvc@tracktoto-7e4ce.iam.gserviceaccount.com`
3. Click **Permissions** tab
4. Ensure it has:
   - ✅ **Firebase Admin SDK Administrator Service Agent**
   - ✅ **Cloud Messaging API Admin**
   - ✅ **Service Account Token Creator** (might be needed)

---

## Solution 4: Update Firebase Admin SDK

Even though you have v11.11.0, try updating to the latest:

```bash
cd backend
npm update firebase-admin
```

Then redeploy.

---

## Solution 5: Use FCM REST API Directly (Workaround)

If the Admin SDK keeps using the old endpoint, we can use the REST API directly:

This is a workaround that bypasses the Admin SDK's endpoint selection.

---

## Solution 6: Check API Quotas and Limits

1. Go to [APIs & Services - Quotas](https://console.cloud.google.com/apis/api/fcm.googleapis.com/quotas?project=tracktoto-7e4ce)
2. Check if there are any quota limits
3. Check if requests are being blocked

---

## Most Likely Fix

**The issue is that the new FCM API v1 needs to be explicitly enabled:**

1. Go to [APIs Library](https://console.cloud.google.com/apis/library?project=tracktoto-7e4ce)
2. Search for **"FCM API"**
3. Enable it (it might be separate from "Firebase Cloud Messaging API")
4. Wait 10 minutes
5. Redeploy
6. Try again

---

## Alternative: Use REST API Directly

If the Admin SDK keeps failing, we can implement a direct REST API call to the v1 endpoint. This bypasses the SDK's endpoint selection.

Would you like me to implement this workaround?

---

## Quick Test

After enabling FCM API v1:

1. Wait 10-15 minutes
2. Redeploy your service
3. Check logs - should see different endpoint being used
4. Try sending a notification

The error should change from `/batch` to something else, or disappear entirely.

