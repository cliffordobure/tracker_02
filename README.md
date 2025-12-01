# School Bus Tracker - MERN Stack Application

A comprehensive school bus tracking system built with the MERN stack (MongoDB, Express.js, React, Node.js), TailwindCSS, and Redux.

## Features

### Admin Panel
- Dashboard with statistics (Schools, Managers, Routes, Students)
- Manage admin accounts
- Manage schools (CRUD operations)
- Manage managers
- View all students and parents
- Geo and County management

### Manager Panel
- Dashboard with statistics (Parents, Students, Routes, Drivers)
- Student management (Add, Edit, Delete, Status management)
- Parent management
- Driver management
- Route management
- Bus stops management
- Live map tracking
- Noticeboard
- Send/Receive messages
- Permission-based access control

### Parent Panel
- Dashboard
- Live map to track children's bus location
- View children's information
- Noticeboard
- Alerts/Notifications
- Contact functionality

### Driver API
- Real-time location tracking
- Start trip functionality
- Mark student pickup/drop

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.io** for real-time updates
- **Firebase Admin SDK** for push notifications
- **Multer** for file uploads

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **React Router** for navigation
- **TailwindCSS** for styling
- **Socket.io Client** for real-time updates
- **React Leaflet** for maps
- **Axios** for API calls

## Project Structure

```
tracker_app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Manager.js
│   │   ├── Parent.js
│   │   ├── Student.js
│   │   ├── Driver.js
│   │   ├── School.js
│   │   ├── Route.js
│   │   ├── Stop.js
│   │   ├── Notification.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── manager.js
│   │   ├── parent.js
│   │   ├── driver.js
│   │   ├── schools.js
│   │   ├── students.js
│   │   ├── routes.js
│   │   └── ...
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracker_app
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

# Firebase Admin SDK (optional for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

4. Start the backend server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/manager/login` - Manager login
- `POST /api/auth/parent/login` - Parent login
- `POST /api/auth/driver/login` - Driver login

### Admin Routes (Requires Admin Auth)
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/accounts` - Get all admin accounts
- `POST /api/admin/accounts` - Create admin account
- `DELETE /api/admin/accounts/:id` - Delete admin account

### School Routes
- `GET /api/schools` - Get all schools
- `GET /api/schools/:id` - Get school by ID
- `POST /api/schools` - Create school (Admin only)
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Suspend school (Admin only)

### Student Routes
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student (Manager only)
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (Manager only)

### Route Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get route by ID
- `POST /api/routes` - Create route (Manager only)
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route (Manager only)

### Driver Routes
- `POST /api/driver/location` - Update driver location
- `POST /api/driver/start` - Start trip
- `POST /api/driver/pickup` - Mark student picked up
- `POST /api/driver/drop` - Mark student dropped

### Parent Routes
- `GET /api/parent/students/locations` - Get student locations
- `GET /api/parent/notifications` - Get notifications
- `PUT /api/parent/notifications/:id/read` - Mark notification as read

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracker_app
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## Usage

1. Start MongoDB service
2. Start the backend server (`npm run dev` in backend folder)
3. Start the frontend server (`npm run dev` in frontend folder)
4. Access the application at `http://localhost:3000`
5. Login with appropriate credentials based on role

## Real-time Features

The application uses Socket.io for real-time location tracking:
- Drivers can update their location in real-time
- Parents and managers can see live bus locations on the map
- Notifications are sent in real-time for trip starts, pickups, and drops

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the ISC License.

