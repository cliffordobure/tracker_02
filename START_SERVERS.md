# Starting the Application

## Quick Start

### Prerequisites
1. **MongoDB must be running**
   - Local MongoDB: Make sure MongoDB service is running
   - Or use MongoDB Atlas (cloud) and update MONGODB_URI in `.env`

2. **Environment Variables**
   - Copy `backend/.env.example` to `backend/.env`
   - Update MongoDB connection string if needed
   - Update JWT_SECRET for production

### Starting Both Servers

#### Option 1: Automatic (Already Running)
The servers have been started automatically in the background:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # Only needed first time
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

### Verify Servers Are Running

- Backend API: http://localhost:5000/api
- Frontend App: http://localhost:3000
- Check console output for any errors

### First Time Setup

1. **Create Admin User:**
   ```bash
   cd backend
   node scripts/createAdmin.js
   ```

   Default credentials:
   - Email: admin@example.com
   - Password: admin123

2. **Access Application:**
   - Open browser: http://localhost:3000
   - Login with admin credentials
   - Change password after first login!

### Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check MONGODB_URI in `.env` file
- For MongoDB Atlas, whitelist your IP address

**Port Already in Use:**
- Backend (5000): Change PORT in `.env`
- Frontend (3000): Change port in `vite.config.js`

**Module Not Found:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Servers Not Starting:**
- Check if MongoDB is running
- Verify `.env` file exists in backend folder
- Check console for error messages

### Development Scripts

**Backend:**
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start with node (production mode)

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Stopping Servers

Press `Ctrl + C` in each terminal window to stop the servers.

