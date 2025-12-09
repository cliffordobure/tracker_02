# FCM 404 Error - Still Failing After Diagnostic Passes

## Your Diagnostic Shows Everything is Correct ✅

- Firebase initialized ✅
- Project ID correct: `tracktoto-7e4ce` ✅
- Messaging API available ✅
- Environment variables set ✅

**But still getting 404 when sending notifications.**

---

## This Means the Issue is During API Call, Not Initialization

The diagnostic passes, but the actual FCM API call fails. Here's what to check:

---

## 🔍 Issue #1: Billing Not Enabled

**Even though the API is enabled, FCM might require billing to be linked.**

### Check Billing:

1. Go to [Google Cloud Billing](https://console.cloud.google.com/billing?project=tracktoto-7e4ce)
2. Check if a billing account is linked
3. If not, link a billing account (free tier is usually sufficient)

**Why this matters:**
- Some Firebase APIs require billing even for free tier usage
- Without billing, the API endpoint returns 404

### Enable Billing:

1. Go to [Billing](https://console.cloud.google.com/billing?project=tracktoto-7e4ce)
2. Click **Link a billing account**
3. Create or select a billing account
4. Wait a few minutes
5. Try again

---

## 🔍 Issue #2: Service Account Needs FCM-Specific Permissions

The service account might need additional permissions beyond "Firebase Admin SDK Administrator".

### Check Current Permissions:

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=tracktoto-7e4ce)
2. Find: `firebase-adminsdk-fbsvc@tracktoto-7e4ce.iam.gserviceaccount.com`
3. Click on it → **Permissions** tab
4. Check what roles it has

### Add Required Permissions:

The service account should have:
- ✅ **Firebase Admin SDK Administrator Service Agent** (you have this)
- ✅ **Cloud Messaging API Admin** (might be missing)

**To add:**
1. Click **Edit** or **Grant Access**
2. Add role: **Cloud Messaging API Admin**
3. Save
4. Wait 2-3 minutes
5. Try again

---

## 🔍 Issue #3: API Enabled But Not Fully Active

The API might show as "enabled" but not be fully active yet.

### Verify API is Actually Active:

1. Go to [APIs & Services - Enabled APIs](https://console.cloud.google.com/apis/dashboard?project=tracktoto-7e4ce)
2. Find "Firebase Cloud Messaging API"
3. Click on it
4. Go to **Metrics** tab
5. Check if there's any activity/requests

**If metrics are empty:**
- API might not be fully active
- Wait 30 minutes after enabling
- Then try again

### Alternative Check:

1. Go to [Firebase Console - Cloud Messaging](https://console.firebase.google.com/project/tracktoto-7e4ce/settings/cloudmessaging)
2. Check if Cloud Messaging is set up
3. If you see setup prompts, complete them

---

## 🔍 Issue #4: Wrong API Version or Endpoint

The Firebase Admin SDK might be using an outdated API endpoint.

### Check Firebase Admin SDK Version:

In your `backend/package.json`, check:
```json
"firebase-admin": "^11.0.0"  // Should be recent version
```

**Update if needed:**
```bash
cd backend
npm update firebase-admin
```

### Verify API Endpoint:

The SDK should be using:
- `https://fcm.googleapis.com/v1/projects/{project-id}/messages:send`

If it's using an old endpoint like `/batch`, that might be the issue.

---

## 🔍 Issue #5: Regional API Restrictions

Some regions have restrictions on FCM API.

### Check API Restrictions:

1. Go to [APIs & Services - Enabled APIs](https://console.cloud.google.com/apis/dashboard?project=tracktoto-7e4ce)
2. Find "Firebase Cloud Messaging API"
3. Check if there are any regional restrictions
4. Check quotas/limits

---

## 🧪 Test the API Directly

Let's test if the API endpoint is actually accessible:

### Option 1: Use Firebase Console Test

1. Go to [Firebase Console - Cloud Messaging](https://console.firebase.google.com/project/tracktoto-7e4ce/cloudmessaging)
2. Click **Send test message**
3. Enter a test token
4. Try to send

**If this also fails:**
- The API is definitely not working
- Check billing and permissions

### Option 2: Check API Quotas

1. Go to [APIs & Services - Quotas](https://console.cloud.google.com/apis/api/fcm.googleapis.com/quotas?project=tracktoto-7e4ce)
2. Check if there are quota limits
3. Check if requests are being blocked

---

## 🔧 Enhanced Logging

I've added enhanced logging. After redeploying, when you try to send a notification, check Render logs for:

```
📤 Sending FCM notification: {
  projectId: "tracktoto-7e4ce",
  tokenCount: 1,
  ...
}
❌ FCM Error Details:
   Code: messaging/unknown-error
   Message: [full error message]
   Error Info: [detailed error info]
```

This will show exactly what's failing.

---

## ✅ Action Plan

1. **Check Billing** (most likely issue)
   - [ ] Go to Google Cloud Billing
   - [ ] Link a billing account if not linked
   - [ ] Wait 5 minutes

2. **Add FCM-Specific Permissions**
   - [ ] Add "Cloud Messaging API Admin" role to service account
   - [ ] Wait 3 minutes

3. **Verify API is Active**
   - [ ] Check API metrics for activity
   - [ ] Wait 30 minutes if just enabled

4. **Test in Firebase Console**
   - [ ] Try sending test message from Firebase Console
   - [ ] If that fails, it's definitely a billing/permissions issue

5. **Redeploy and Check Enhanced Logs**
   - [ ] Redeploy after making changes
   - [ ] Try sending notification
   - [ ] Check logs for detailed error info

---

## 🎯 Most Likely Fix

**90% chance it's billing:**

1. Go to [Billing](https://console.cloud.google.com/billing?project=tracktoto-7e4ce)
2. Link a billing account (even free tier)
3. Wait 5 minutes
4. Try again

**If billing is already linked, then:**
1. Add "Cloud Messaging API Admin" role
2. Wait 3 minutes
3. Try again

---

## 📞 Still Not Working?

If you've done all the above:

1. **Share the enhanced error logs** from Render (after trying to send notification)
2. **Check if Firebase Console test message works**
3. **Verify billing account is active** (not just linked, but active)
4. **Check API quotas** for any limits

The 404 error with correct initialization usually means:
- Billing not enabled (most common)
- Missing FCM-specific permissions
- API not fully active yet

