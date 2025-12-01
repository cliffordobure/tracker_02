# MongoDB URI Format Guide

## Understanding MongoDB Connection Strings

The MongoDB URI format is:
```
mongodb+srv://username:password@cluster.mongodb.net/DATABASE_NAME?options
```

The **database name** comes after the cluster URL and before any query parameters.

---

## Your Current Setup

Based on your MongoDB Atlas/Compass view, you have a database named **"test"** with these collections:
- admins
- drivers
- managers
- notifications
- parents
- routes
- schools
- stops
- students

---

## Connection String Format

### ✅ If Database Name is "test"

**In your `backend/.env` file:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority
```

**OR for local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/test
```

### ✅ If Database Name is "tracker_app" (Different)

**In your `backend/.env` file:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tracker_app?retryWrites=true&w=majority
```

---

## How to Determine Your Database Name

1. **Look in MongoDB Compass/Atlas:**
   - The database name is what you see in the left sidebar
   - In your case, it shows **"test"**

2. **Check where your collections are:**
   - If collections (admins, drivers, etc.) are under "test" database
   - Then use `/test` in the connection string

---

## Examples

### Atlas Connection String:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/test?retryWrites=true&w=majority
                                                                   ^^^^
                                                           Database name here
```

### Local Connection String:
```
mongodb://localhost:27017/test
                               ^^^^
                        Database name here
```

---

## ✅ What You Should Do

Since your database is named **"test"**, your connection string should be:

```env
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/test?retryWrites=true&w=majority
```

**Important Notes:**
- The database name (`test`) comes **after** the cluster URL
- It comes **before** the query parameters (`?retryWrites=true&w=majority`)
- If your database name is different, replace `test` with that name

---

## Changing Database Name (Optional)

If you want to use a different database name (like `tracker_app`):

### Option 1: Create New Database
1. In MongoDB Atlas/Compass, create a new database named `tracker_app`
2. Migrate your collections to the new database
3. Update connection string to use `/tracker_app`

### Option 2: Rename Database
1. Use MongoDB commands to rename "test" to "tracker_app"
2. Update connection string to use `/tracker_app`

### Option 3: Keep "test" Name
- Simply use `/test` in your connection string
- Everything will work fine with this name

---

## Quick Check

**To verify your connection string is correct:**

1. Look at your MongoDB Atlas/Compass
2. Note the database name (e.g., "test")
3. Make sure your connection string ends with `/test` (or whatever the database name is)

**Example:**
- Database name: **test** ✅
- Connection string should be: `...mongodb.net/test?...`

---

## Summary

**Yes, you should add `/test` to your MONGODB_URI** if that's the name of your database in Atlas.

**Format:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test
                                                                   ^^^^
                                                            Add database name here
```

If your database has a different name, use that name instead of `test`.

