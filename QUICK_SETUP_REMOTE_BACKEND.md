# Quick Setup: Connect Frontend to Remote Backend

## ✅ Configuration Steps

### Step 1: Create Environment File

Create a file named `.env` in the `frontend` folder:

**Path:** `frontend/.env`

**Content:**
```env
VITE_API_URL=https://tracker-02.onrender.com/api
```

### Step 2: Restart Frontend

Stop your frontend server (Ctrl+C) and restart it:

```bash
cd frontend
npm run dev
```

---

## ✅ That's It!

Your frontend will now connect to `https://tracker-02.onrender.com` instead of localhost.

---

## 🔍 Verify It's Working

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Check that API calls go to `https://tracker-02.onrender.com/api/*`

---

## ⚠️ Backend CORS Configuration

Make sure your hosted backend allows requests from `http://localhost:3000`.

**In your backend `.env` file on Render:**
```env
FRONTEND_URL=http://localhost:3000
```

Or update CORS to allow localhost in development.

---

## 🔄 Switch Back to Local Backend

To switch back to local backend, simply remove or comment out the line:

```env
# VITE_API_URL=https://tracker-02.onrender.com/api
```

Or change it to:
```env
VITE_API_URL=http://localhost:5000/api
```

Remember to restart the frontend server after changing `.env`!

---

**Need more details?** See `FRONTEND_BACKEND_CONFIG.md`

