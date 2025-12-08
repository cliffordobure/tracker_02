// Script to extract Firebase environment variables from service account JSON
// Usage: node scripts/extractFirebaseEnv.js

const fs = require('fs');
const path = require('path');

const jsonFilePath = path.join(__dirname, '../../tracktoto-parent-firebase-adminsdk.json');

if (!fs.existsSync(jsonFilePath)) {
  console.error('❌ Error: Firebase service account JSON file not found!');
  console.error(`   Expected location: ${jsonFilePath}`);
  console.error('\n📝 To fix:');
  console.error('   1. Download your Firebase service account JSON file');
  console.error('   2. Place it in the project root as: tracktoto-parent-firebase-adminsdk.json');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

  console.log('\n✅ Firebase Environment Variables for Render:\n');
  console.log('Copy and paste these into your Render Environment Variables:\n');
  console.log('─'.repeat(60));
  
  // Required variables
  console.log('\n📋 REQUIRED VARIABLES:\n');
  console.log(`FIREBASE_PROJECT_ID=${serviceAccount.project_id}`);
  console.log(`FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`);
  
  // Private key - preserve newlines as \n
  const privateKey = serviceAccount.private_key.replace(/\n/g, '\\n');
  console.log(`FIREBASE_PRIVATE_KEY=${privateKey}`);
  
  // Optional variables
  if (serviceAccount.private_key_id) {
    console.log(`\n📋 OPTIONAL VARIABLES:\n`);
    console.log(`FIREBASE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}`);
  }
  if (serviceAccount.client_id) {
    console.log(`FIREBASE_CLIENT_ID=${serviceAccount.client_id}`);
  }
  if (serviceAccount.client_x509_cert_url) {
    console.log(`FIREBASE_CLIENT_X509_CERT_URL=${serviceAccount.client_x509_cert_url}`);
  }
  
  console.log('\n─'.repeat(60));
  console.log('\n✅ Done! Copy the variables above to Render.\n');
  
} catch (error) {
  console.error('❌ Error reading Firebase service account file:', error.message);
  console.error('\n📝 Make sure the JSON file is valid.');
  process.exit(1);
}

