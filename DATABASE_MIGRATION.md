# Database Migration Guide

This guide explains how to migrate all data from your old MongoDB database (MONGODB_URI_OLD) to your new MongoDB database (MONGODB_URI).

## Prerequisites

1. Both MongoDB databases must be accessible
2. The old database (MONGODB_URI_OLD) should have all your existing data
3. The new database (MONGODB_URI) should be empty or ready to receive data

## Setup

### Step 1: Add Environment Variables

Add the following to your `backend/.env` file:

```env
# New MongoDB (remote accessible)
MONGODB_URI=mongodb://your-new-remote-connection-string

# Old MongoDB (source database)
MONGODB_URI_OLD=mongodb://your-old-connection-string
```

**Example:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tracker_app?retryWrites=true&w=majority
MONGODB_URI_OLD=mongodb://localhost:27017/tracker_app
```

### Step 2: Run the Migration Script

```bash
cd backend
node scripts/migrateDatabase.js
```

## What Gets Migrated

The script will migrate all collections found in the old database, including:

- ✅ **admins** - Admin accounts
- ✅ **managers** - School managers
- ✅ **parents** - Parent accounts
- ✅ **drivers** - Driver accounts
- ✅ **students** - Student records
- ✅ **schools** - School information
- ✅ **routes** - Bus routes
- ✅ **stops** - Bus stops
- ✅ **notifications** - Notification history
- ✅ **noticeboards** - Noticeboard posts
- ✅ **contacts** - Contact information
- ✅ **staffs** - Staff records
- ✅ **Any other collections** found in the database

## Migration Process

1. **Connects to both databases** - Old (source) and New (destination)
2. **Lists all collections** - Finds all collections in the old database
3. **Migrates each collection** - Copies all documents from old to new
4. **Preserves ObjectIds** - Maintains all references and relationships
5. **Handles duplicates** - Uses upsert to avoid duplicate key errors
6. **Shows progress** - Real-time progress for each collection

## Features

- ✅ **Automatic detection** - Finds all collections automatically
- ✅ **Batch processing** - Processes documents in batches for efficiency
- ✅ **Error handling** - Continues even if one collection fails
- ✅ **Progress tracking** - Shows real-time migration progress
- ✅ **Duplicate handling** - Handles existing documents gracefully
- ✅ **Summary report** - Shows complete migration summary at the end

## Example Output

```
🔄 Starting database migration...

📡 Connecting to OLD database...
✅ Connected to OLD database

📡 Connecting to NEW database...
✅ Connected to NEW database

📋 Found 12 collections in OLD database:
   - admins
   - managers
   - parents
   - drivers
   - students
   - schools
   - routes
   - stops
   - notifications
   - noticeboards
   - contacts
   - staffs

🔄 Migrating collection: admins
   📊 Found 1 documents
   ✅ Successfully migrated 1 documents

🔄 Migrating collection: schools
   📊 Found 5 documents
   ✅ Successfully migrated 5 documents

...

============================================================
📊 MIGRATION SUMMARY
============================================================
Total collections found: 12
Collections migrated: 12
Collections skipped: 0
Total documents to migrate: 150
Documents migrated: 150
============================================================

✅ Migration completed successfully!
```

## Important Notes

1. **Backup First**: Always backup your data before migration
2. **Test Connection**: Make sure both MongoDB URIs are correct and accessible
3. **Network Access**: Ensure remote MongoDB allows your IP address
4. **Data Validation**: Verify data integrity after migration
5. **Update Application**: Update your application to use MONGODB_URI after migration

## Troubleshooting

### Connection Error

**Problem:** Cannot connect to old or new database

**Solution:**
- Verify MongoDB connection strings are correct
- Check network connectivity
- Ensure MongoDB is running (for local)
- Whitelist your IP (for MongoDB Atlas)
- Check firewall settings

### Duplicate Key Error

**Problem:** Documents already exist in new database

**Solution:**
- The script handles this automatically using upsert
- Existing documents will be updated
- No data loss occurs

### Missing Collections

**Problem:** Some collections are not migrated

**Solution:**
- Check if collections exist in old database
- Review error messages in output
- Collections with 0 documents are skipped

### Partial Migration

**Problem:** Only some documents migrated

**Solution:**
- Check error messages in console
- Run migration again (it will skip existing documents)
- Check MongoDB connection stability

## Verification

After migration, verify your data:

1. **Check collection counts:**
   ```bash
   # Connect to new database and verify
   use tracker_app
   db.admins.countDocuments()
   db.students.countDocuments()
   # etc.
   ```

2. **Test application:**
   - Start your application
   - Login and verify data appears correctly
   - Check relationships (students to parents, routes to drivers, etc.)

3. **Compare counts:**
   - Compare document counts between old and new databases
   - Ensure all important data is present

## Safety Features

- ✅ **Non-destructive** - Only reads from old database
- ✅ **Upsert mode** - Won't fail on duplicates
- ✅ **Error recovery** - Continues even if one collection fails
- ✅ **Progress tracking** - Can monitor migration progress

## Next Steps

After successful migration:

1. ✅ Update your application to use `MONGODB_URI`
2. ✅ Test all functionality
3. ✅ Keep old database as backup (for a while)
4. ✅ Monitor application for any issues
5. ✅ Update all services to use new database

## Support

If you encounter issues:

1. Check the error messages in console output
2. Verify MongoDB connection strings
3. Check MongoDB logs
4. Ensure sufficient permissions on both databases
5. Review this documentation

---

**Note:** This migration script is safe to run multiple times. It will skip existing documents and only add new ones.

