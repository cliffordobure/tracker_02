// Firebase Admin SDK service for push notifications
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

// Try to initialize Firebase from environment variables (preferred for cloud platforms like Render)
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  try {
    // Parse the private key (it may have escaped newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
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

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully from environment variables');
    } else {
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing Firebase from environment variables:', error.message);
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
    console.log('FCM not configured - would send notification:', { deviceTokens, message, data });
    return { success: false, message: 'Firebase not configured' };
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

