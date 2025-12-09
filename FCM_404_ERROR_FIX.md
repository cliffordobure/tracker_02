# Fixing FCM 404 Error on Render

## Error You're Seeing

```
Error 404 (Not Found) - The requested URL /batch was not found
FirebaseMessagingError: An unknown server error was returned
```

## Root Causes

This error typically happens when:

1. **Cloud Messaging API is not enabled** in your Firebase project
2. **Service account credentials are incorrect or incomplete**
3. **Service account doesn't have proper permissions**
4. **Private key format is incorrect** in environment variables

---

## Solution Steps

### Step 1: Enable Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **tracktoto-7e4ce**
3. Go to **APIs & Services** → **Library**
4. Search for **"Firebase Cloud Messaging API"**
5. Click on it and click **Enable**
6. Wait for it to enable (may take a minute)

**Alternative method:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **tracktoto-7e4ce**
3. Go to **Project Settings** → **Cloud Messaging** tab
4. This will automatically enable the API if not already enabled

### Step 2: Verify Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **tracktoto-7e4ce**
3. Go to **IAM & Admin** → **Service Accounts**
4. Find your service account (email like: `firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com`)
5. Click on it and check **Permissions**
6. It should have:
   - **Firebase Admin SDK Administrator Service Agent** (recommended)
   - OR at minimum: **Cloud Messaging API Admin**

If permissions are missing:
1. Click **Edit** or **Grant Access**
2. Add role: **Firebase Admin SDK Administrator Service Agent**
3. Save

### Step 3: Verify Environment Variables in Render

Go to Render → Your Service → Environment tab and verify:

#### Required Variables:

1. **FIREBASE_PROJECT_ID**
   - Should be: `tracktoto-7e4ce`
   - No spaces, no quotes

2. **FIREBASE_CLIENT_EMAIL**
   - Should be: `firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com`
   - Full email address

3. **FIREBASE_PRIVATE_KEY**
   - Must include: `-----BEGIN PRIVATE KEY-----` at the start
   - Must include: `-----END PRIVATE KEY-----` at the end
   - Keep all `\n` characters (or use actual newlines)
   - Full key, nothing cut off

#### Common Issues with FIREBASE_PRIVATE_KEY:

❌ **Wrong:**
```
FIREBASE_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
```
(Missing BEGIN/END markers)

❌ **Wrong:**
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
(Extra quotes - Render doesn't need quotes)

✅ **Correct:**
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

### Step 4: Regenerate Service Account Key (If Needed)

If you're still having issues, regenerate the service account key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Click **Generate new private key**
4. Download the new JSON file
5. Extract environment variables again:
   ```bash
   node backend/scripts/extractFirebaseEnv.js
   ```
6. Update Render environment variables with new values
7. Redeploy

### Step 5: Test After Changes

After making changes:

1. **Redeploy** your service on Render
2. Check deployment logs for:
   ```
   ✅ Firebase Admin SDK initialized successfully from environment variables
      Project ID: tracktoto-7e4ce
      Client Email: firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com
   ```

3. Test sending a notification (e.g., driver marks student as boarded)
4. Check logs - should see:
   ```
   ✅ FCM: Successfully sent X notifications
   ```

Instead of:
   ```
   ❌ Error 404 (Not Found) - /batch
   ```

---

## Quick Checklist

- [ ] Cloud Messaging API is enabled in Google Cloud Console
- [ ] Service account has proper permissions (Firebase Admin SDK Administrator)
- [ ] FIREBASE_PROJECT_ID is set correctly
- [ ] FIREBASE_CLIENT_EMAIL is set correctly
- [ ] FIREBASE_PRIVATE_KEY includes full key with BEGIN/END markers
- [ ] No extra quotes around environment variable values
- [ ] Service has been redeployed after setting variables
- [ ] Checked deployment logs for initialization success

---

## Debugging Steps

### 1. Check Initialization Logs

After deployment, check if Firebase initialized:
- ✅ Success: `Firebase Admin SDK initialized successfully`
- ❌ Failure: `Error initializing Firebase` or `Firebase not configured`

### 2. Verify API is Enabled

Run this in Google Cloud Console:
1. Go to **APIs & Services** → **Enabled APIs**
2. Search for "Firebase Cloud Messaging"
3. Should see it listed as **Enabled**

### 3. Test Service Account

You can test if the service account works by checking its permissions:
1. Google Cloud Console → IAM & Admin → Service Accounts
2. Find your service account
3. Check it has Firebase-related roles

### 4. Check Private Key Format

The private key should:
- Start with: `-----BEGIN PRIVATE KEY-----`
- End with: `-----END PRIVATE KEY-----`
- Have `\n` characters between (or actual newlines)
- Be the complete key (not truncated)

---

## Still Not Working?

If you've done all the above and still getting 404:

1. **Double-check the service account email** matches what's in Render
2. **Verify the project ID** is exactly `tracktoto-7e4ce` (no typos)
3. **Try regenerating** the service account key
4. **Check Google Cloud Console** for any API quota limits or errors
5. **Wait a few minutes** after enabling APIs (they can take time to propagate)

---

## Expected Behavior After Fix

✅ **Success logs:**
```
✅ Firebase Admin SDK initialized successfully from environment variables
   Project ID: tracktoto-7e4ce
   Client Email: firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com
✅ FCM: Successfully sent 1 notifications
```

❌ **Error logs (before fix):**
```
❌ Error sending push notification: FirebaseMessagingError: Error 404 (Not Found)
```

---

## Summary

The 404 error means Firebase can't find the Cloud Messaging API endpoint. This is usually because:

1. **API not enabled** → Enable Cloud Messaging API in Google Cloud Console
2. **Wrong credentials** → Verify environment variables are correct
3. **Missing permissions** → Grant Firebase Admin SDK Administrator role

After fixing these, redeploy and test again!

