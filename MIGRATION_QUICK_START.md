# Quick Start: Database Migration

## 📋 Quick Steps

### 1. Add Environment Variables

Edit `backend/.env` file and add:

```env
MONGODB_URI=mongodb://your-new-remote-connection-string
MONGODB_URI_OLD=mongodb://your-old-connection-string
```

### 2. Run Migration

```bash
cd backend
node scripts/migrateDatabase.js
```

That's it! The script will:
- ✅ Connect to both databases
- ✅ Find all collections automatically
- ✅ Copy all data from old to new
- ✅ Show progress and summary

## 📝 Example

```bash
# Navigate to backend folder
cd backend

# Run migration script
node scripts/migrateDatabase.js
```

## ✅ What Gets Migrated

All collections including:
- Admins, Managers, Parents, Drivers
- Students, Schools, Routes, Stops
- Notifications, Noticeboards
- Contacts, Staff
- **Plus any other collections** found in the database

## 🔍 Verify After Migration

Check your new database to ensure all data was copied successfully.

---

**Need more details?** See `DATABASE_MIGRATION.md` for comprehensive documentation.

