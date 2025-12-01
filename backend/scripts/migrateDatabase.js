const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migrateDatabase() {
  const oldUri = process.env.MONGODB_URI_OLD;
  const newUri = process.env.MONGODB_URI;

  if (!oldUri) {
    console.error('❌ MONGODB_URI_OLD is not defined in .env file');
    console.log('\nPlease add MONGODB_URI_OLD to your backend/.env file:');
    console.log('MONGODB_URI_OLD=mongodb://your-old-connection-string');
    process.exit(1);
  }

  if (!newUri) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
  }

  console.log('🔄 Starting database migration...\n');
  console.log('Source (OLD):', oldUri.replace(/\/\/.*@/, '//***@')); // Hide credentials
  console.log('Destination (NEW):', newUri.replace(/\/\/.*@/, '//***@')); // Hide credentials
  console.log('');

  let oldConnection, newConnection;
  let oldDb, newDb;

  try {
    // Connect to old database
    console.log('📡 Connecting to OLD database...');
    oldConnection = mongoose.createConnection(oldUri);
    
    await new Promise((resolve, reject) => {
      oldConnection.once('connected', () => {
        oldDb = oldConnection.db;
        console.log('✅ Connected to OLD database\n');
        resolve();
      });
      oldConnection.once('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });

    // Connect to new database
    console.log('📡 Connecting to NEW database...');
    newConnection = mongoose.createConnection(newUri);
    
    await new Promise((resolve, reject) => {
      newConnection.once('connected', () => {
        newDb = newConnection.db;
        console.log('✅ Connected to NEW database\n');
        resolve();
      });
      newConnection.once('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });

    // Get actual collection names from old database
    const existingCollections = await oldDb.listCollections().toArray();
    const actualCollectionNames = existingCollections.map(c => c.name);
    
    console.log(`📋 Found ${actualCollectionNames.length} collections in OLD database:`);
    actualCollectionNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    let totalDocuments = 0;
    let migratedDocuments = 0;
    let skippedCollections = 0;

    // Migrate each collection
    for (const collectionName of actualCollectionNames) {
      try {
        console.log(`\n🔄 Migrating collection: ${collectionName}`);
        
        const oldCollection = oldDb.collection(collectionName);
        const newCollection = newDb.collection(collectionName);

        // Check if collection exists and has data
        const count = await oldCollection.countDocuments();
        
        if (count === 0) {
          console.log(`   ⏭️  Skipping (empty collection)`);
          skippedCollections++;
          continue;
        }

        console.log(`   📊 Found ${count} documents`);
        totalDocuments += count;

        // Get all documents from old collection
        const documents = await oldCollection.find({}).toArray();

        if (documents.length === 0) {
          console.log(`   ⏭️  No documents to migrate`);
          skippedCollections++;
          continue;
        }

        // Clear existing data in new collection (optional - comment out if you want to keep existing data)
        const existingCount = await newCollection.countDocuments();
        if (existingCount > 0) {
          console.log(`   ⚠️  Warning: Collection already has ${existingCount} documents`);
          console.log(`   🗑️  Clearing existing data in new database...`);
          await newCollection.deleteMany({});
        }

        // Insert documents into new collection
        let insertedCount = 0;
        let batchSize = 100;

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          
          try {
            // Try to insert with insertMany
            const result = await newCollection.insertMany(batch, { ordered: false });
            insertedCount += result.insertedCount;
          } catch (error) {
            // If batch insert fails, try individual inserts
            if (error.code === 11000 || error.name === 'BulkWriteError') {
              console.log(`   ⚠️  Some documents already exist, inserting individually...`);
              for (const doc of batch) {
                try {
                  await newCollection.replaceOne(
                    { _id: doc._id },
                    doc,
                    { upsert: true }
                  );
                  insertedCount++;
                } catch (individualError) {
                  if (individualError.code !== 11000) {
                    console.error(`   ❌ Error inserting document ${doc._id}:`, individualError.message);
                  }
                }
              }
            } else {
              throw error;
            }
          }

          // Show progress
          const progress = Math.min(i + batchSize, documents.length);
          process.stdout.write(`\r   ⏳ Progress: ${progress}/${documents.length} documents`);
        }

        console.log(`\n   ✅ Successfully migrated ${insertedCount} documents`);
        migratedDocuments += insertedCount;

      } catch (error) {
        console.error(`\n   ❌ Error migrating collection ${collectionName}:`, error.message);
        // Continue with next collection
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total collections found: ${actualCollectionNames.length}`);
    console.log(`Collections migrated: ${actualCollectionNames.length - skippedCollections}`);
    console.log(`Collections skipped: ${skippedCollections}`);
    console.log(`Total documents to migrate: ${totalDocuments}`);
    console.log(`Documents migrated: ${migratedDocuments}`);
    console.log('='.repeat(60));

    if (migratedDocuments === totalDocuments) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some issues. Please review the output above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (oldConnection) {
      await oldConnection.close();
      console.log('\n🔌 Closed connection to OLD database');
    }
    if (newConnection) {
      await newConnection.close();
      console.log('🔌 Closed connection to NEW database');
    }
  }
}

// Run migration
migrateDatabase()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
