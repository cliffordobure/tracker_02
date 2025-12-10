# Bus Tracking Debug Guide

## Issue: Drivers Not Showing on Map

If drivers are not appearing on the live tracking map, here are the common causes and solutions:

## Common Issues

### 1. **Drivers Haven't Updated Their Location**
The most common reason is that drivers haven't started their journey or updated their location from the mobile app.

**Solution:**
- Drivers must use the mobile app to update their location
- They need to call the `/api/driver/location` endpoint with their latitude and longitude
- Once a driver updates their location, it will appear on the map in real-time

### 2. **Socket.io Connection Issues**

**Check Browser Console:**
- Open browser DevTools (F12)
- Look for Socket.io connection messages:
  - ✅ "Connected to Socket.io server" - Connection successful
  - ❌ "Socket.io connection error" - Connection failed
  - ⚠️ "Socket.io disconnected" - Connection lost

**Common Socket.io Issues:**
- Backend URL might be incorrect
- CORS configuration might be blocking the connection
- Backend server might not be running

**Solution:**
- Check `BACKEND_URL` in `frontend/src/config/api.js`
- Ensure backend server is running
- Check backend CORS settings in `backend/server.js`

### 3. **No Location Data in Database**

**Check if drivers have location data:**
- Drivers might exist but have `null` latitude/longitude
- Location data is only set when drivers update via mobile app

**Solution:**
- Check database: `Driver` collection should have `latitude` and `longitude` fields
- If null, drivers need to update location from mobile app

### 4. **Backend URL Configuration**

**Check your `.env` file in frontend folder:**
```env
VITE_API_URL=http://localhost:5000/api
```

**Or if using remote backend:**
```env
VITE_API_URL=https://your-backend-url.com/api
```

**The Socket.io connection uses:**
- `BACKEND_URL` = `VITE_API_URL` without `/api`
- Default: `http://localhost:5000`

### 5. **Google Maps API Key**

**Check if Google Maps is loading:**
- If map doesn't load, check `VITE_GOOGLE_MAPS_API_KEY` in `.env`
- The map component will show a warning if API key is missing

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - `🔄 Updating driver locations from props:` - Shows drivers being loaded
   - `✅ Added driver X at (lat, lng)` - Shows drivers with valid locations
   - `⚠️ Driver X has no valid location data` - Shows drivers without locations
   - `📍 Total driver locations: X` - Shows count of drivers with locations
   - `✅ Connected to Socket.io server` - Socket connection successful

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Look for:
   - `/api/manager/drivers` - Should return driver list with latitude/longitude
   - Socket.io connection (ws:// or wss://)

### Step 3: Verify Driver Data
Check the API response for `/api/manager/drivers`:
```json
[
  {
    "_id": "...",
    "name": "Driver Name",
    "latitude": 28.7041,  // ← Must not be null
    "longitude": 77.1025,  // ← Must not be null
    "currentRoute": { "name": "Route Name" }
  }
]
```

### Step 4: Test Socket.io Connection
In browser console, you should see:
- `Connecting to Socket.io at: http://localhost:5000`
- `✅ Connected to Socket.io server [socket-id]`

If you see errors, check:
- Backend server is running
- Backend URL is correct
- CORS is configured properly

## Testing the System

### 1. Test with Manual Location Update
You can manually update a driver's location in the database:
```javascript
// In MongoDB or via API
db.drivers.updateOne(
  { email: "driver@example.com" },
  { 
    $set: { 
      latitude: 28.7041, 
      longitude: 77.1025,
      updatedAt: new Date()
    }
  }
)
```

### 2. Test Socket.io Broadcast
The backend broadcasts location updates via:
- `io.emit('location-update', locationData)` - Global broadcast
- `io.to('route:routeId').emit('driver-location-update', locationData)` - Route-specific

### 3. Refresh the Dashboard
- Click "Refresh Drivers" button on the dashboard
- This will reload driver data from the API

## Expected Behavior

1. **When drivers have location data:**
   - Yellow bus markers appear on the map
   - Map automatically zooms to show all buses
   - Clicking a marker shows driver details
   - Real-time updates appear as drivers move

2. **When no drivers have location data:**
   - Map shows default center (Delhi, India)
   - Message: "No active buses at the moment"
   - Instructions to have drivers update location

3. **When Socket.io is connected:**
   - Green "● Connected" indicator on map
   - Real-time location updates appear automatically

## Quick Fixes

### Fix 1: Ensure Backend is Running
```bash
cd backend
npm start
```

### Fix 2: Check Backend URL
In `frontend/src/config/api.js`, verify `BACKEND_URL` is correct.

### Fix 3: Check CORS
In `backend/server.js`, ensure frontend URL is in allowed origins.

### Fix 4: Test Driver Location Update
Use the mobile app or API to update a driver's location:
```bash
POST /api/driver/location
{
  "latitude": 28.7041,
  "longitude": 77.1025
}
```

## Still Not Working?

1. Check browser console for specific error messages
2. Verify backend logs for Socket.io connection attempts
3. Test Socket.io connection manually using a tool like Postman
4. Verify drivers exist and have valid location data in database
5. Check network tab for failed API requests

