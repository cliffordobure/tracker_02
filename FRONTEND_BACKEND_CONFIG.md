# Frontend to Backend Configuration

## ✅ Configuration Complete!

Your local frontend is now configured to connect to the hosted backend at `https://tracker-02.onrender.com`.

---

## 🔧 Configuration Steps

### Step 1: Create Environment File

Create a `.env` file in the `frontend` folder:

**File:** `frontend/.env`

```env
VITE_API_URL=https://tracker-02.onrender.com/api
```

### Step 2: Restart Frontend Server

After creating the `.env` file, restart your frontend development server:

1. Stop the current frontend server (Ctrl+C)
2. Start it again:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📝 What Was Changed

1. ✅ **Created API Configuration** (`frontend/src/config/api.js`)
   - Centralized API URL configuration
   - Uses environment variable `VITE_API_URL`
   - Falls back to `/api` (local proxy) if not set

2. ✅ **Updated API Service** (`frontend/src/services/api.js`)
   - Now uses environment variable for backend URL

3. ✅ **Updated All Redux Slices**
   - `authSlice.js` - Uses shared API config
   - `adminSlice.js` - Uses shared API config
   - `managerSlice.js` - Uses shared API config
   - `parentSlice.js` - Uses shared API config

---

## 🔄 Switching Between Backends

### For Hosted Backend (Production)
```env
VITE_API_URL=https://tracker-02.onrender.com/api
```

### For Local Backend (Development)
```env
VITE_API_URL=http://localhost:5000/api
```

Or simply remove/comment out the variable to use the local proxy:
```env
# VITE_API_URL=https://tracker-02.onrender.com/api
```

---

## ⚙️ How It Works

1. **Environment Variable** (`VITE_API_URL`)
   - If set, all API calls go directly to that URL
   - No proxy needed

2. **Fallback** (if `VITE_API_URL` not set)
   - Uses `/api` which goes through Vite proxy
   - Proxy redirects to `http://localhost:5000`

3. **CORS Configuration**
   - Make sure your hosted backend allows requests from `http://localhost:3000`
   - Backend should have CORS configured for local development

---

## 🌐 Backend CORS Configuration

Make sure your hosted backend (`https://tracker-02.onrender.com`) allows requests from your local frontend.

**In your backend `.env` file:**
```env
FRONTEND_URL=http://localhost:3000
```

**Or allow all origins in development:**
```javascript
app.use(cors({
  origin: true, // Allow all origins (for development)
  credentials: true
}));
```

---

## ✅ Verification

After configuration, verify the connection:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in or making any API call
4. Check that requests go to `https://tracker-02.onrender.com/api/*`
5. Verify responses are received successfully

---

## 🐛 Troubleshooting

### CORS Errors

**Problem:** Browser shows CORS errors

**Solution:**
- Update backend CORS settings to allow `http://localhost:3000`
- Check `FRONTEND_URL` in backend `.env`

### Connection Failed

**Problem:** Cannot connect to backend

**Solution:**
- Verify backend URL is correct: `https://tracker-02.onrender.com`
- Check if backend is running (Render dashboard)
- Verify network connectivity

### API Calls Still Going to Localhost

**Problem:** Still connecting to local backend

**Solution:**
1. Verify `.env` file exists in `frontend` folder
2. Check `VITE_API_URL` is set correctly
3. Restart frontend server (Vite needs restart for env changes)

### Environment Variable Not Working

**Problem:** `import.meta.env.VITE_API_URL` is undefined

**Solution:**
- Ensure variable name starts with `VITE_` (required by Vite)
- Restart dev server after adding/editing `.env`
- Check `.env` file is in `frontend` folder (not `backend`)

---

## 📱 Mobile Apps

For mobile apps, use the same backend URL:

**Android/iOS Configuration:**
```javascript
const API_URL = 'https://tracker-02.onrender.com/api';
```

---

## 🔒 Security Notes

1. **Production:** Use environment variables, never hardcode URLs
2. **HTTPS:** Backend should use HTTPS (already using Render HTTPS)
3. **CORS:** Properly configure CORS on backend for security
4. **Environment Files:** Add `.env` to `.gitignore` (don't commit secrets)

---

## ✨ Next Steps

1. ✅ Create `frontend/.env` file with `VITE_API_URL`
2. ✅ Restart frontend server
3. ✅ Test connection by logging in
4. ✅ Verify all API calls work correctly

Your frontend is now ready to connect to the hosted backend! 🚀

