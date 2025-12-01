# Create Admin in Remote Database

## Problem

The admin account was created in your **local database**, but your frontend is now connecting to the **remote backend** on Render, which uses a **different database** (MongoDB Atlas).

## Solution: Create Admin in Remote Database

You have **two options** to create the admin account in your remote database:

---

## Option 1: Run Script Locally (Pointing to Remote Database) ⭐ Recommended

### Step 1: Update Backend .env Temporarily

Edit your `backend/.env` file to point to the **remote database**:

```env
# Use remote database temporarily
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/test?retryWrites=true&w=majority

# Other variables...
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Step 2: Run the Create Admin Script

```bash
cd backend
node scripts/createAdmin.js
```

This will create the admin in your **remote database**.

### Step 3: Restore Local .env (Optional)

After creating the admin, you can restore your local database connection if needed.

---

## Option 2: Create Admin via API (If You Have Access)

If you have another admin account or can access the API directly, you can create an admin via the API endpoint (but you'd need to be authenticated first).

---

## Option 3: Create Directly in MongoDB Atlas

### Using MongoDB Atlas Web Interface:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Click "Browse Collections"
4. Go to your database (e.g., "test")
5. Find the "admins" collection
6. Click "Insert Document"
7. Add this document:

```json
{
  "name": "Super Admin",
  "email": "admin@example.com",
  "password": "$2a$10$...",  // You'll need to hash this - see below
  "access": "Super Admin",
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** The password needs to be hashed. It's easier to use Option 1.

---

## ⭐ Quick Solution

**Update your `backend/.env` to point to remote database, then run:**

```bash
cd backend
node scripts/createAdmin.js
```

This will create:
- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## Verify Admin Exists

After running the script, you can verify in MongoDB Atlas:

1. Go to MongoDB Atlas
2. Browse Collections
3. Check "admins" collection
4. You should see the admin document

---

## After Creating Admin

1. ✅ Admin is now in remote database
2. ✅ Frontend can login with:
   - Email: `admin@example.com`
   - Password: `admin123`
3. ✅ Login should work!


