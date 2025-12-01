# Server Status

## ✅ Servers Are Running!

Both servers have been started successfully:

### Frontend (React)
- **Status:** ✅ Running
- **URL:** http://localhost:3000
- **Port:** 3000

### Backend (Express.js)
- **Status:** ✅ Running  
- **URL:** http://localhost:5000
- **Port:** 5000

## ⚠️ Important Setup Steps

### 1. Create Backend `.env` File

You need to create a `.env` file in the `backend` folder. 

**Create:** `backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracker_app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Quick way to create it:**
1. Navigate to `backend` folder
2. Create a new file named `.env`
3. Copy the content above into it

### 2. Ensure MongoDB is Running

The backend needs MongoDB to work properly. 

**Check if MongoDB is running:**
- Look for MongoDB service in Windows Services
- Or check if you can connect to `mongodb://localhost:27017`

**If MongoDB is not installed:**
- Install MongoDB locally, OR
- Use MongoDB Atlas (free cloud option) and update the connection string

### 3. Create Admin User

Once MongoDB is connected and backend is fully running:

```bash
cd backend
node scripts/createAdmin.js
```

This creates:
- **Email:** admin@example.com
- **Password:** admin123

## Access the Application

1. **Open your browser**
2. **Go to:** http://localhost:3000
3. **Login with:**
   - Email: `admin@example.com`
   - Password: `admin123`

## Verify Everything is Working

### Check Frontend:
- ✅ Visit: http://localhost:3000
- You should see the login page

### Check Backend:
- ✅ Visit: http://localhost:5000/api
- You might see an error about routes, but that's normal

### Check MongoDB Connection:
- The backend will show "MongoDB connected successfully" in the console if connected
- If not, you'll see connection errors

## Stopping the Servers

To stop the servers, you can:
1. Close the terminal windows where they're running, OR
2. Press `Ctrl + C` in each terminal

To restart:
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2  
cd frontend
npm run dev
```

## Next Steps

1. ✅ Servers are running
2. ⚠️ Create `backend/.env` file (if not exists)
3. ⚠️ Ensure MongoDB is running
4. ⚠️ Create admin user
5. ✅ Open http://localhost:3000 and login

---

**Note:** If you see any errors in the console, check:
- MongoDB connection status
- `.env` file exists and has correct values
- All dependencies are installed (they are ✅)

