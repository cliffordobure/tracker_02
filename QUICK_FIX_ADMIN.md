# Quick Fix: Create Admin in Remote Database

## 🎯 The Problem

You're getting "Invalid credentials" because:
- ✅ Admin was created in **local database**
- ❌ Frontend now connects to **remote backend** (Render)
- ❌ Remote backend uses **different database** (MongoDB Atlas)
- ❌ Admin doesn't exist in remote database

## ✅ Solution: Create Admin in Remote Database

### Step 1: Check Your Backend .env File

Make sure your `backend/.env` has the **remote MongoDB URI**:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority
```

**Important:** Make sure it points to your **remote database** (the one with `/test` or your database name).

### Step 2: Run Create Admin Script

```bash
cd backend
node scripts/createAdmin.js
```

### Step 3: Verify

You should see:
```
✅ Admin created successfully!

Login Credentials:
Email: admin@example.com
Password: admin123
```

### Step 4: Try Login Again

Now try logging in with:
- **Email:** `admin@example.com`
- **Password:** `admin123`

It should work! ✅

---

## 🔍 Which Database is Being Used?

The script uses `MONGODB_URI` from your `backend/.env` file. 

**Check:**
- If `MONGODB_URI` points to remote → Admin created in remote ✅
- If `MONGODB_URI` points to local → Admin created in local ❌

Make sure it's pointing to your **remote database** (MongoDB Atlas).

---

## ⚡ One-Line Solution

1. Update `backend/.env` to use remote MongoDB URI
2. Run: `cd backend && node scripts/createAdmin.js`
3. Login with `admin@example.com` / `admin123`

That's it! 🎉


