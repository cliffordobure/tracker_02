const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const { setSocketIO } = require('./services/socketService');

dotenv.config();

const app = express();
const server = http.createServer(app);
// Socket.IO CORS origins
const socketOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ["http://localhost:3000", "http://localhost:49154"];

// Add production URLs for Socket.IO
const socketProductionUrls = [
  'https://track-toto.vercel.app'
];

socketProductionUrls.forEach(url => {
  const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
  if (!socketOrigins.includes(cleanUrl) && !socketOrigins.includes(url)) {
    socketOrigins.push(cleanUrl);
  }
});

const io = socketIo(server, {
  cors: {
    origin: socketOrigins.length > 0 ? socketOrigins : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Set socket.io instance for use in routes
setSocketIO(io);

// Middleware
// CORS configuration - allow multiple origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ["http://localhost:3000", "http://localhost:49154"];

// Add production URLs
const productionUrls = [
  'https://track-toto.vercel.app'
];

// Add production URLs if not already present
productionUrls.forEach(url => {
  const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
  if (!allowedOrigins.includes(cleanUrl) && !allowedOrigins.includes(url)) {
    allowedOrigins.push(cleanUrl);
  }
});

// Add production URL if backend is on Render
if (process.env.RENDER && !allowedOrigins.includes(process.env.RENDER_EXTERNAL_URL)) {
  // Extract frontend URL from Render (if available)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  allowedOrigins.push(frontendUrl);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // For development, allow localhost on any port
      if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
        callback(null, true);
      } else {
        // Log for debugging
        console.log('CORS blocked origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Increase body parser limit to handle image uploads (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Serve uploaded files from parent directory (uploads folder preserved from PHP app)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Serve public images
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io for real-time location tracking with room-based connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join parent room (for receiving notifications)
  socket.on('join-parent-room', ({ parentId }) => {
    if (parentId) {
      socket.join(`parent:${parentId}`);
      console.log(`Parent ${parentId} joined their room`);
    }
  });

  // Join route room (for tracking driver location)
  socket.on('join-route-room', ({ routeId }) => {
    if (routeId) {
      socket.join(`route:${routeId}`);
      console.log(`Client joined route room: ${routeId}`);
    }
  });

  // Join driver room (for driver-specific updates)
  socket.on('join-driver-room', ({ driverId }) => {
    if (driverId) {
      socket.join(`driver:${driverId}`);
      console.log(`Driver ${driverId} joined their room`);
    }
  });

  // Join manager room (for receiving all driver location updates)
  socket.on('join-manager-room', async () => {
    socket.join('managers');
    console.log(`Manager/Admin joined managers room`);
    
    // Send all current driver locations when manager joins
    try {
      const Driver = require('./models/Driver');
      const drivers = await Driver.find({
        status: { $ne: 'Deleted' },
        latitude: { $ne: null },
        longitude: { $ne: null }
      })
        .populate('currentRoute', 'name')
        .select('_id name latitude longitude vehicleNumber currentRoute');
      
      console.log(`📡 Sending ${drivers.length} driver locations to manager`);
      
      drivers.forEach(driver => {
        if (driver.latitude && driver.longitude) {
          const locationData = {
            driverId: driver._id.toString(),
            driverName: driver.name,
            latitude: driver.latitude,
            longitude: driver.longitude,
            routeId: driver.currentRoute?._id?.toString(),
            routeName: driver.currentRoute?.name || 'No Route',
            vehicleNumber: driver.vehicleNumber,
            timestamp: new Date().toISOString()
          };
          
          // Send to this specific manager
          socket.emit('location-update', locationData);
          socket.emit('driver-location-update', locationData);
        }
      });
    } catch (error) {
      console.error('Error sending driver locations to manager:', error);
    }
  });

  // Leave route room
  socket.on('leave-route-room', ({ routeId }) => {
    if (routeId) {
      socket.leave(`route:${routeId}`);
      console.log(`Client left route room: ${routeId}`);
    }
  });

  // Driver location update (legacy support)
  socket.on('driver-location', (data) => {
    // Broadcast driver location to route room
    if (data.routeId) {
      io.to(`route:${data.routeId}`).emit('location-update', data);
    }
    // Also broadcast globally for backward compatibility
    io.emit('location-update', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/parent', require('./routes/parent'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/students', require('./routes/students'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/stops', require('./routes/stops'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/fcm', require('./routes/fcm-test')); // FCM diagnostic endpoint

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { io };

