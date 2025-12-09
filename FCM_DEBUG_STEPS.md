# FCM 404 Error - Debugging Steps

## You've Done:
- ✅ Enabled Cloud Messaging API
- ✅ Verified service account permissions
- ✅ Checked environment variables

But still getting 404 error. Let's debug further.

---

## Step 1: Verify API is Actually Enabled

1. Go to [Google Cloud Console - APIs](https://console.cloud.google.com/apis/dashboard?project=tracktoto-7e4ce)
2. Search for "Firebase Cloud Messaging API"
3. Make sure it shows **ENABLED** (not just "API Enabled" but actually active)
4. Check the status - should be green/active

**Alternative Check:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/tracktoto-7e4ce/settings/cloudmessaging)
2. Cloud Messaging tab should show your project is set up

---

## Step 2: Verify Environment Variables Match Project

Check your Render environment variables match exactly:

1. **FIREBASE_PROJECT_ID** must be exactly: `tracktoto-7e4ce`
   - No spaces
   - No quotes
   - Case-sensitive

2. **FIREBASE_CLIENT_EMAIL** must match the service account email
   - Format: `firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com`
   - Check in [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=tracktoto-7e4ce)

3. **FIREBASE_PRIVATE_KEY** must be the complete key
   - Includes `-----BEGIN PRIVATE KEY-----`
   - Includes `-----END PRIVATE KEY-----`
   - All `\n` characters preserved

---

## Step 3: Check Service Account is from Correct Project

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=tracktoto-7e4ce)
2. Find the service account you're using
3. Verify the email matches `FIREBASE_CLIENT_EMAIL` in Render
4. Click on it → **Keys** tab
5. Verify the key ID matches (if you have `FIREBASE_PRIVATE_KEY_ID` set)

---

## Step 4: Wait for API Propagation

After enabling the API, it can take **5-15 minutes** to fully propagate. 

**Check if it's ready:**
1. Go to [APIs & Services](https://console.cloud.google.com/apis/dashboard?project=tracktoto-7e4ce)
2. Click on "Firebase Cloud Messaging API"
3. Check "Metrics" - should show activity if it's working
4. Check "Quotas" - should be available

---

## Step 5: Verify Service Account Permissions

The service account needs:

1. **Firebase Admin SDK Administrator Service Agent** (recommended)
   OR
2. **Cloud Messaging API Admin** (minimum)

**To check:**
1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=tracktoto-7e4ce)
2. Click your service account
3. Go to **Permissions** tab
4. Should see one of the roles above

**To add:**
1. Click **Edit** or **Grant Access**
2. Add role: **Firebase Admin SDK Administrator Service Agent**
3. Save

---

## Step 6: Test with Firebase Admin SDK Directly

Create a test script to verify credentials work:

```javascript
// test-firebase.js
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });

  console.log('✅ Firebase initialized');
  
  // Test messaging
  admin.messaging().send({
    token: 'test_token',
    notification: {
      title: 'Test',
      body: 'Test message'
    }
  }).then(() => {
    console.log('✅ Messaging API works!');
  }).catch(error => {
    console.error('❌ Messaging API error:', error.message);
    console.error('Error code:', error.code);
  });
} catch (error) {
  console.error('❌ Initialization error:', error.message);
}
```

Run on Render (via SSH or add as a test endpoint).

---

## Step 7: Check Render Logs for Initialization

After redeploying, check Render logs for:

**Success:**
```
✅ Firebase Admin SDK initialized successfully from environment variables
   Project ID: tracktoto-7e4ce
   Client Email: firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com
```

**Failure:**
```
❌ Error initializing Firebase from environment variables: [error message]
```

If you see an initialization error, that's the problem.

---

## Step 8: Common Issues

### Issue 1: Wrong Project ID
**Symptom:** API enabled but 404 error  
**Fix:** Verify `FIREBASE_PROJECT_ID` in Render matches exactly `tracktoto-7e4ce`

### Issue 2: Private Key Format
**Symptom:** Initialization works but messaging fails  
**Fix:** Ensure private key includes BEGIN/END markers and all `\n` characters

### Issue 3: API Not Fully Enabled
**Symptom:** Shows enabled but still 404  
**Fix:** Wait 10-15 minutes, then redeploy

### Issue 4: Service Account from Different Project
**Symptom:** Credentials work but wrong project  
**Fix:** Regenerate service account key from correct project

### Issue 5: Billing Required
**Symptom:** API enabled but quota errors  
**Fix:** Some APIs require billing to be enabled (even if free tier)

---

## Step 9: Verify Billing (If Required)

Some Firebase features require billing to be enabled (even on free tier):

1. Go to [Billing](https://console.cloud.google.com/billing?project=tracktoto-7e4ce)
2. Check if billing account is linked
3. If not, link a billing account (free tier is usually sufficient)

---

## Step 10: Regenerate Service Account Key

If nothing else works, regenerate the service account key:

1. Go to [Firebase Console](https://console.firebase.google.com/project/tracktoto-7e4ce/settings/serviceaccounts/adminsdk)
2. Click **Generate new private key**
3. Download new JSON
4. Extract new environment variables:
   ```bash
   node backend/scripts/extractFirebaseEnv.js
   ```
5. Update Render with new values
6. Redeploy

---

## Step 11: Check API Quotas

1. Go to [APIs & Services - Quotas](https://console.cloud.google.com/apis/api/fcm.googleapis.com/quotas?project=tracktoto-7e4ce)
2. Check if there are any quota limits
3. Verify requests are not being throttled

---

## Step 12: Test API Directly

Test if the API endpoint is accessible:

1. Get an access token from your service account
2. Try calling the FCM API directly:
   ```bash
   curl -X POST https://fcm.googleapis.com/v1/projects/tracktoto-7e4ce/messages:send \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message":{"token":"test","notification":{"title":"Test"}}}'
   ```

If this also returns 404, the API is definitely not accessible.

---

## Most Likely Causes (In Order)

1. **API propagation delay** - Wait 10-15 minutes after enabling
2. **Wrong project ID** - Verify `FIREBASE_PROJECT_ID` matches exactly
3. **Service account from wrong project** - Regenerate from correct project
4. **Private key format issue** - Check BEGIN/END markers and `\n` characters
5. **Billing not enabled** - Link billing account (free tier OK)

---

## Quick Verification Checklist

Run through this checklist:

- [ ] API shows "ENABLED" in Google Cloud Console
- [ ] Waited 10-15 minutes after enabling API
- [ ] `FIREBASE_PROJECT_ID` = `tracktoto-7e4ce` (exact match, no spaces)
- [ ] `FIREBASE_CLIENT_EMAIL` matches service account email exactly
- [ ] `FIREBASE_PRIVATE_KEY` includes full key with BEGIN/END markers
- [ ] Service account has "Firebase Admin SDK Administrator" role
- [ ] Service account is from project `tracktoto-7e4ce` (not another project)
- [ ] Redeployed after setting environment variables
- [ ] Checked Render logs for initialization success
- [ ] Billing account is linked (if required)

---

## Still Not Working?

If you've checked everything above:

1. **Share Render logs** showing Firebase initialization
2. **Verify project ID** by checking what Firebase Console shows
3. **Try regenerating** service account key
4. **Check if there are multiple Firebase projects** - make sure you're using the right one

The 404 error specifically means the API endpoint `/batch` is not found, which usually means:
- API not enabled (but you said it is)
- Wrong project ID (most likely)
- API not fully propagated (wait longer)

