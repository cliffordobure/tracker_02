# FCM 404 Error - Quick Fix Guide

## You've Checked Everything But Still Getting 404?

The most common causes when API is enabled and permissions are correct:

---

## 🔍 Most Likely Issue #1: Project ID Mismatch

**Check this FIRST:**

1. Go to Render → Environment Variables
2. Check `FIREBASE_PROJECT_ID` value
3. It must be **exactly**: `tracktoto-7e4ce`
   - No spaces before/after
   - No quotes
   - Case-sensitive (lowercase)
   - No typos

**Common mistakes:**
- ❌ `tracktoto-7e4ce ` (space at end)
- ❌ ` tracktoto-7e4ce` (space at start)
- ❌ `"tracktoto-7e4ce"` (quotes)
- ❌ `Tracktoto-7e4ce` (wrong case)
- ❌ `tracktoto-7e4ce-` (extra dash)

**Fix:**
- Copy the project ID exactly from Firebase Console
- Paste into Render (no spaces, no quotes)
- Redeploy

---

## 🔍 Most Likely Issue #2: API Propagation Delay
**After enabling the API, it can take 10-15 minutes to fully activate.**

**Check if it's ready:**
1. Go to [Google Cloud Console - APIs](https://console.cloud.google.com/apis/dashboard?project=tracktoto-7e4ce)
2. Click on "Firebase Cloud Messaging API"
3. Check the **Metrics** tab - should show activity
4. If metrics are empty, API might not be fully active yet

**Solution:**
- Wait 15 minutes after enabling
- Then redeploy your service on Render
- Try again

---

## 🔍 Most Likely Issue #3: Service Account from Wrong Project

**Verify the service account belongs to the correct project:**

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=tracktoto-7e4ce)
2. Find the service account you're using
3. Check the email format: `firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com`
4. The part after `@` must be: `tracktoto-7e4ce.iam.gserviceaccount.com`

**If it's different:**
- The service account is from a different project
- Regenerate the key from the correct project

---

## 🔍 Most Likely Issue #4: Private Key Format

**Check the private key in Render:**

1. Go to Render → Environment Variables
2. Check `FIREBASE_PRIVATE_KEY`
3. It must include:
   - `-----BEGIN PRIVATE KEY-----` at the start
   - `-----END PRIVATE KEY-----` at the end
   - All `\n` characters (or actual newlines)

**Common issues:**
- ❌ Key is truncated (cut off)
- ❌ Missing BEGIN/END markers
- ❌ `\n` characters removed

**Fix:**
- Regenerate service account key
- Use the extraction script: `node backend/scripts/extractFirebaseEnv.js`
- Copy the exact output to Render

---

## 🔍 Most Likely Issue #5: Need to Redeploy

**After changing environment variables or enabling API:**

1. You MUST redeploy the service
2. Environment variables are loaded at startup
3. Changes won't take effect until redeploy

**Fix:**
- Go to Render → Manual Deploy → Deploy latest commit
- Or push a new commit to trigger auto-deploy
- Wait for deployment to complete

---

## 🧪 Test Your Configuration

After redeploying, check Render logs for:

**Success:**
```
✅ Firebase Admin SDK initialized successfully from environment variables
   Project ID: tracktoto-7e4ce
   Client Email: firebase-adminsdk-xxxxx@tracktoto-7e4ce.iam.gserviceaccount.com
✅ Firebase Messaging API is available
```

**Failure:**
```
❌ Error initializing Firebase from environment variables: [error]
```

**If you see initialization errors, that's the problem!**

---

## 🔧 Diagnostic Endpoint

I've added a diagnostic endpoint. After deploying, visit:

```
GET https://your-render-url/api/fcm/test
```

This will show:
- If Firebase is initialized
- Project ID being used
- If messaging API is available
- Environment variable status
- Any errors

---

## ✅ Quick Checklist

Run through this in order:

1. [ ] **Project ID is exactly `tracktoto-7e4ce`** (no spaces, no quotes)
2. [ ] **Waited 15 minutes** after enabling API
3. [ ] **Redeployed** after setting/changing environment variables
4. [ ] **Service account email** contains `@tracktoto-7e4ce.iam.gserviceaccount.com`
5. [ ] **Private key** includes BEGIN/END markers and all `\n` characters
6. [ ] **Checked Render logs** for initialization success
7. [ ] **API shows "ENABLED"** in Google Cloud Console (not just listed)

---

## 🎯 Most Common Fix

**90% of the time, it's one of these:**

1. **Project ID has a space or typo** → Fix: Copy exactly from Firebase Console
2. **Didn't redeploy after changes** → Fix: Redeploy on Render
3. **API not fully propagated** → Fix: Wait 15 minutes, then redeploy

---

## 📞 Still Not Working?

If you've checked everything above:

1. **Share the diagnostic endpoint output**: `GET /api/fcm/test`
2. **Share Render logs** showing Firebase initialization
3. **Double-check project ID** by looking at Firebase Console URL
4. **Try regenerating** service account key from scratch

The 404 error specifically means the API endpoint isn't found, which usually means:
- Wrong project ID (most common)
- API not fully enabled/propagated
- Service account from different project

