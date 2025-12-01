# 🚀 Setup Required - Action Needed

## Current Status

✅ **Frontend:** Running on http://localhost:3000  
⚠️ **Backend:** Started but needs configuration

## Required Actions

### 1. Create Backend `.env` File (CRITICAL)

**Create file:** `backend/.env`

**Content:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracker_app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**How to create:**
1. Open `backend` folder
2. Create a new file named `.env` (with the dot at the start)
3. Paste the content above
4. Save the file

### 2. Ensure MongoDB is Running

**Option A: Check if MongoDB is installed locally**
- Look for MongoDB in Windows Services
- Or try: `mongod --version` in terminal

**Option B: Install MongoDB (if not installed)**
- Download from: https://www.mongodb.com/try/download/community
- Install and start the MongoDB service

**Option C: Use MongoDB Atlas (Cloud - Free)**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env` file

### 3. Restart Backend Server

After creating `.env` file:

**Option 1: Stop and restart**
- Find the Node.js process running the backend
- Stop it (or restart your terminal)
- Then run:
  ```bash
  cd backend
  npm run dev
  ```

**Option 2: The backend should auto-restart if nodemon detects the `.env` file**

### 4. Verify Backend is Running

Check browser: http://localhost:5000/api

You should see an error about routes (that's normal - means server is running!)

### 5. Create Admin User

Once backend is fully running with MongoDB connected:

```bash
cd backend
node scripts/createAdmin.js
```

**Default credentials created:**
- Email: `admin@example.com`
- Password: `admin123`

## Access Your Application

1. Open browser
2. Go to: **http://localhost:3000**
3. You should see the login page
4. Use admin credentials to login

## Quick Checklist

- [ ] Create `backend/.env` file
- [ ] MongoDB is running (local or Atlas)
- [ ] Backend server restarted with `.env`
- [ ] Backend responds on http://localhost:5000
- [ ] Created admin user
- [ ] Frontend accessible on http://localhost:3000
- [ ] Can login to application

## Troubleshooting

**Backend won't start:**
- Check if `.env` file exists
- Check MongoDB connection
- Look at backend console for error messages

**MongoDB connection error:**
- Verify MongoDB is running
- Check connection string in `.env`
- For Atlas: Check IP whitelist

**Frontend shows errors:**
- Make sure backend is running
- Check browser console (F12)

---

**The servers are running - just need the `.env` file and MongoDB connection!**

