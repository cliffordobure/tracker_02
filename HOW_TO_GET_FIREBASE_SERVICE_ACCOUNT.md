# How to Get Firebase Service Account JSON for FCM

## ⚠️ Important: You Need a Different File

The file you have (`google-services.json`) is for **client-side** (mobile app) configuration.  
For **backend FCM**, you need the **Service Account JSON** file, which is different.

---

## Step-by-Step: Get Service Account JSON

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tracktoto-7e4ce** (from your config)

### Step 2: Navigate to Service Accounts

1. Click the **⚙️ Gear icon** (Settings) in the top left
2. Select **Project Settings**
3. Click on the **Service Accounts** tab (at the top)

### Step 3: Generate New Private Key

1. You'll see a section titled **"Firebase Admin SDK"**
2. You'll see options:
   - **Node.js** tab (this is what we need)
   - **Python** tab
   - **Java** tab
   - etc.

3. Make sure you're on the **Node.js** tab

4. Click the button: **"Generate new private key"**

5. A dialog will appear warning about security - click **"Generate key"**

6. A JSON file will be downloaded (e.g., `tracktoto-7e4ce-firebase-adminsdk-xxxxx.json`)

### Step 4: What the File Looks Like

The downloaded file will look like this:

```json
{
  "type": "service_account",
  "project_id": "tracktoto-7e4ce",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tracktoto-7e4ce.iam.gserviceaccount.com"
}
```

**This is the file you need!**

---

## Step 5: Extract Environment Variables

### Option A: Use the Helper Script (Recommended)

1. **Rename the downloaded file** to: `tracktoto-parent-firebase-adminsdk.json`
2. **Place it in the project root** (same folder as `backend` folder)
3. **Run the extraction script:**

```bash
cd backend
node scripts/extractFirebaseEnv.js
```

This will output all the environment variables you need to add to Render.

### Option B: Manual Extraction

From the JSON file, extract these values:

1. **FIREBASE_PROJECT_ID** = `project_id` value
   ```
   FIREBASE_PROJECT_ID=tracktoto-7e4ce
   ```

2. **FIREBASE_CLIENT_EMAIL** = `client_email` value
   ```
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com
   ```

3. **FIREBASE_PRIVATE_KEY** = `private_key` value (keep the entire key including BEGIN/END)
   ```
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
   ```

   ⚠️ **Important:** Keep all the `\n` characters or use actual newlines.

---

## Step 6: Add to Render

1. Go to your **Render Dashboard**
2. Select your **backend service**
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable:

```
FIREBASE_PROJECT_ID=tracktoto-7e4ce
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_FULL_KEY_HERE\n-----END PRIVATE KEY-----\n
```

6. **Save** and **Redeploy**

---

## Visual Guide

### Firebase Console Navigation:

```
Firebase Console
  └─ Select Project: tracktoto-7e4ce
      └─ ⚙️ Settings (Gear Icon)
          └─ Project Settings
              └─ Service Accounts Tab
                  └─ Node.js Tab
                      └─ [Generate new private key] Button
                          └─ Download JSON File
```

---

## Quick Checklist

- [ ] Go to Firebase Console
- [ ] Select project: tracktoto-7e4ce
- [ ] Settings → Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Download the JSON file
- [ ] Rename to: `tracktoto-parent-firebase-adminsdk.json`
- [ ] Place in project root
- [ ] Run: `node backend/scripts/extractFirebaseEnv.js`
- [ ] Copy output to Render environment variables
- [ ] Redeploy on Render

---

## Troubleshooting

### "Generate new private key" button not visible?

- Make sure you're logged in as a project owner/admin
- Check that you have the correct permissions
- Try refreshing the page

### Can't find Service Accounts tab?

- Make sure you're in **Project Settings** (not User Settings)
- Look for tabs: General, Service Accounts, Cloud Messaging, etc.
- Service Accounts should be one of the top tabs

### File downloaded but can't find it?

- Check your browser's Downloads folder
- The file name will be something like: `tracktoto-7e4ce-firebase-adminsdk-xxxxx-abc123.json`

### Still getting "FCM not configured"?

1. Verify all 3 environment variables are set in Render
2. Check the `FIREBASE_PRIVATE_KEY` includes the full key with BEGIN/END markers
3. Make sure you redeployed after adding variables
4. Check Render logs for initialization message

---

## Security Reminder

⚠️ **Never commit the service account JSON file to Git!**

Make sure it's in `.gitignore`:
```
tracktoto-parent-firebase-adminsdk.json
*.json
```

---

## Summary

**What you have:** `google-services.json` (client config) ❌  
**What you need:** Service Account JSON (admin SDK) ✅

**How to get it:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Download JSON file
4. Extract environment variables
5. Add to Render
6. Redeploy

After this, FCM will work! 🎉

