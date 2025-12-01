# Quick Start Guide

## ⚠️ Important: Setup Required Before Running

### Step 1: Create Backend Environment File

Create a file named `.env` in the `backend` folder with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracker_app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Note:** Change `JWT_SECRET` to a secure random string for production!

### Step 2: Ensure MongoDB is Running

**Option A: Local MongoDB**
- Make sure MongoDB service is running on your machine
- Default connection: `mongodb://localhost:27017/tracker_app`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update `MONGODB_URI` in `.env` file

### Step 3: Start the Servers

The servers are currently running in the background:

**Frontend:** ✅ Running on http://localhost:3000
**Backend:** ⚠️ Check if running on http://localhost:5000

If backend is not running, start it manually:

```bash
cd backend
npm run dev
```

### Step 4: Create Admin User (First Time Only)

Once backend is running, create an admin account:

```bash
cd backend
node scripts/createAdmin.js
```

This creates:
- Email: `admin@example.com`
- Password: `admin123`

### Step 5: Access the Application

1. Open your browser
2. Go to: http://localhost:3000
3. Login with the admin credentials
4. **Change the password after first login!**

## Current Status

✅ Frontend: Running on port 3000
⚠️ Backend: Please check if running (may need MongoDB connection)

## Troubleshooting

### Backend won't start?
1. Check if MongoDB is running
2. Verify `.env` file exists in backend folder
3. Check console for error messages

### Frontend won't load?
1. Check if backend is running (frontend needs backend API)
2. Check browser console for errors

### MongoDB Connection Error?
- Make sure MongoDB is installed and running
- Verify connection string in `.env` file
- For MongoDB Atlas, check IP whitelist

## Next Steps

1. ✅ Dependencies installed
2. ⚠️ Create `.env` file in backend folder
3. ⚠️ Ensure MongoDB is running
4. ✅ Frontend server started
5. ⚠️ Verify backend server is running
6. ⚠️ Create admin user
7. ✅ Access application at http://localhost:3000

