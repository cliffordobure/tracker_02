# Setup Instructions

## Prerequisites
1. Node.js (v16 or higher) installed
2. MongoDB installed and running (or MongoDB Atlas account)
3. npm or yarn package manager

## Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example if available)
# Or create manually with the following content:
```

Create `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracker_app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

```bash
# Start MongoDB (if using local MongoDB)
# On Windows: mongod
# On Mac/Linux: sudo systemctl start mongod

# Start the backend server
npm run dev
```

The backend should now be running on `http://localhost:5000`

### 2. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend should now be running on `http://localhost:3000`

### 3. Create Initial Admin User

You can create an initial admin user by running a MongoDB script or using the API:

```javascript
// Using MongoDB shell or MongoDB Compass
// Connect to your database and run:

db.admins.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hashed password
  access: "Super Admin",
  status: "Active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or create a script file `backend/scripts/createAdmin.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker_app')
  .then(async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      access: 'Super Admin'
    });
    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
```

Run it with: `node backend/scripts/createAdmin.js`

### 4. Access the Application

1. Open your browser and go to `http://localhost:3000`
2. You should see the login page
3. Login with the admin credentials you created
4. Start using the application!

## Common Issues

### MongoDB Connection Error
- Make sure MongoDB is running
- Check if the MONGODB_URI in .env is correct
- For MongoDB Atlas, make sure your IP is whitelisted

### Port Already in Use
- Backend: Change PORT in .env file
- Frontend: Change port in vite.config.js

### Module Not Found Errors
- Make sure you've run `npm install` in both backend and frontend directories
- Delete node_modules and package-lock.json, then run `npm install` again

### CORS Errors
- Make sure FRONTEND_URL in backend/.env matches your frontend URL
- Check that both servers are running

## Production Deployment

### Backend
1. Set NODE_ENV=production
2. Use a strong JWT_SECRET
3. Use a production MongoDB URI (MongoDB Atlas recommended)
4. Set up proper error logging
5. Use PM2 or similar process manager

### Frontend
1. Build the application: `npm run build`
2. Serve the `dist` folder with a web server (nginx, Apache, etc.)
3. Configure API proxy if needed

## Additional Configuration

### Firebase Push Notifications (Optional)
1. Get Firebase Admin SDK credentials
2. Place the JSON file in the backend directory
3. Uncomment and configure the firebaseService.js file
4. Update the notification routes to use Firebase

### File Uploads
1. Create `uploads` directory in backend: `mkdir backend/uploads`
2. Configure multer settings in routes that handle file uploads

## Testing

You can test the API endpoints using:
- Postman
- cURL
- The frontend application itself

Example API call:
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

