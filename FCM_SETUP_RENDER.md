# FCM Setup for Render (Firebase Cloud Messaging)

## Problem

You're seeing logs like:
```
FCM not configured - would send notification: { ... }
```

This means Firebase Cloud Messaging is not configured. On Render, you need to use **environment variables** instead of a JSON file.

---

## Solution: Configure FCM with Environment Variables

### Step 1: Get Your Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (e.g., `tracktoto-parent-firebase-adminsdk.json`)

### Step 2: Extract Values from JSON File

Open the downloaded JSON file. It looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 3: Add Environment Variables to Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add the following variables:

#### Required Variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
```

#### Optional Variables (if available):

```
FIREBASE_PRIVATE_KEY_ID=abc123...
FIREBASE_CLIENT_ID=123456789
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

### Step 4: Important - Private Key Format

⚠️ **CRITICAL**: When copying the `private_key` value:

1. **Keep the entire key including** `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
2. **Keep all `\n` characters** - they represent newlines
3. **Copy the entire key as a single line** - Render will handle it

Example:
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

**OR** you can format it with actual newlines (Render supports both):
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

### Step 5: Redeploy Your Service

After adding the environment variables:

1. Go to **Manual Deploy** → **Deploy latest commit**
2. Or push a new commit to trigger auto-deploy
3. Wait for deployment to complete

### Step 6: Verify FCM is Working

After deployment, check your Render logs. You should see:

```
✅ Firebase Admin SDK initialized successfully from environment variables
```

Instead of:
```
⚠️  Firebase not configured. Push notifications will be disabled.
```

---

## Quick Setup Script

If you have the JSON file locally, you can use the provided script to extract the values:

```bash
cd backend
node scripts/extractFirebaseEnv.js
```

This will automatically extract all the environment variables from your `tracktoto-parent-firebase-adminsdk.json` file and display them in the correct format for Render.

**Note:** Make sure the JSON file is in the project root before running the script.

---

## Alternative: Using Render's Secret Files (Advanced)

If you prefer, you can also:

1. Upload the JSON file to Render as a secret file
2. Update the code to read from that location

But **environment variables are the recommended approach** for Render.

---

## Testing FCM

After setup, test by:

1. **Driver marks student as boarded** - Check if parent receives notification
2. **Driver starts journey** - Check if all parents receive notification
3. **Parent sends message** - Check if driver/teacher receives notification

Check Render logs for:
- `✅ FCM: Successfully sent X notifications` (success)
- `⚠️ FCM: X notifications failed` (some failures - check device tokens)
- `FCM not configured` (still not working - check environment variables)

---

## Troubleshooting

### Still seeing "FCM not configured"?

1. **Check environment variables are set:**
   - Go to Render → Environment tab
   - Verify all required variables are present

2. **Check private key format:**
   - Must include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Must preserve `\n` characters (or use actual newlines)

3. **Check deployment:**
   - Make sure you redeployed after adding environment variables
   - Check deployment logs for errors

4. **Check Firebase project:**
   - Verify Firebase project is active
   - Check Cloud Messaging API is enabled
   - Verify service account has proper permissions

### "Invalid credentials" error?

- Double-check the `FIREBASE_PRIVATE_KEY` value
- Make sure you copied the entire key
- Verify `FIREBASE_CLIENT_EMAIL` matches the service account email

### Notifications not being received?

- Verify device tokens are being sent from mobile app
- Check device tokens are valid (not expired)
- Verify Firebase project is correct
- Check mobile app has notification permissions

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit** the JSON file or environment variables to Git
2. **Use different Firebase projects** for development and production
3. **Rotate keys** if they're ever exposed
4. **Limit service account permissions** to only what's needed

---

## Summary

✅ **What you need:**
- Firebase project with Cloud Messaging enabled
- Service account JSON file
- Environment variables set in Render

✅ **Steps:**
1. Download Firebase service account JSON
2. Extract values from JSON
3. Add as environment variables in Render
4. Redeploy service
5. Verify in logs

✅ **Result:**
- FCM notifications will work
- Parents/drivers/teachers will receive push notifications
- No more "FCM not configured" logs

---

## Need Help?

If you're still having issues:

1. Check Render deployment logs for errors
2. Verify all environment variables are set correctly
3. Test with a simple notification first
4. Check Firebase Console for API usage/errors

