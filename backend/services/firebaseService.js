// Firebase Admin SDK service for push notifications
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
let initializationError = null;

// Try to initialize Firebase from environment variables (preferred for cloud platforms like Render)
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  try {
    // Parse the private key (it may have escaped newlines)
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different formats of private key
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Validate private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      throw new Error('Invalid private key format. Must include BEGIN/END markers.');
    }
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || ''
    };

    // Validate required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing required Firebase credentials');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully from environment variables');
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email}`);
    } else {
      firebaseInitialized = true;
    }
  } catch (error) {
    initializationError = error;
    console.error('❌ Error initializing Firebase from environment variables:', error.message);
    console.error('   Please check:');
    console.error('   1. FIREBASE_PRIVATE_KEY includes full key with BEGIN/END markers');
    console.error('   2. FIREBASE_CLIENT_EMAIL is correct');
    console.error('   3. FIREBASE_PROJECT_ID matches your Firebase project');
  }
}

// If not initialized from env vars, try to load from file (for local development)
if (!firebaseInitialized) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../tracktoto-parent-firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully from file');
    } else {
      firebaseInitialized = true;
    }
  } catch (error) {
    // Only show warning if neither method worked
    if (!firebaseInitialized) {
      console.warn('⚠️  Firebase not configured. Push notifications will be disabled.');
      console.warn('📝 To enable FCM:');
      console.warn('   1. Set environment variables (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID)');
      console.warn('   2. OR place tracktoto-parent-firebase-adminsdk.json in the project root');
      firebaseInitialized = false;
    }
  }
}

const sendPushNotification = async (deviceTokens, message, data = {}, title = 'School Bus Tracker') => {
  if (!firebaseInitialized) {
    if (initializationError) {
      console.error('FCM not configured due to initialization error:', initializationError.message);
    } else {
      console.log('FCM not configured - would send notification:', { deviceTokens, message, data });
    }
    return { success: false, message: 'Firebase not configured' };
  }

  // Verify Firebase is actually working
  try {
    // Quick validation - check if messaging is available
    if (!admin.messaging) {
      throw new Error('Firebase Messaging API not available');
    }
  } catch (error) {
    console.error('Firebase Messaging API error:', error.message);
    return { success: false, message: 'Firebase Messaging API not available. Please enable Cloud Messaging API in Firebase Console.' };
  }

  try {
    // Filter out null/undefined tokens
    const validTokens = Array.isArray(deviceTokens) 
      ? deviceTokens.filter(token => token && token.trim() !== '')
      : (deviceTokens && deviceTokens.trim() !== '' ? [deviceTokens] : []);

    if (validTokens.length === 0) {
      console.log('No valid device tokens provided');
      return { success: false, message: 'No valid device tokens' };
    }

    const messageObj = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        ...data,
        message: message,
        timestamp: new Date().toISOString(),
      },
      tokens: validTokens,
    };

    const response = await admin.messaging().sendMulticast(messageObj);
    
    // Log results
    if (response.failureCount > 0) {
      console.warn(`FCM: ${response.failureCount} notifications failed out of ${response.successCount + response.failureCount}`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`Failed token ${idx}:`, resp.error);
        }
      });
    } else {
      console.log(`FCM: Successfully sent ${response.successCount} notifications`);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, message: error.message, error: error };
  }
};

// Helper function to send notification to a single device
const sendToDevice = async (deviceToken, message, data = {}, title = 'School Bus Tracker') => {
  return sendPushNotification([deviceToken], message, data, title);
};

module.exports = { sendPushNotification, sendToDevice };

