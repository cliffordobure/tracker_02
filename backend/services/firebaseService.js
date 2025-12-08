// Firebase Admin SDK service for push notifications
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  // Try to load service account from file
  const serviceAccountPath = path.join(__dirname, '../../tracktoto-parent-firebase-adminsdk.json');
  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    firebaseInitialized = true;
  }
} catch (error) {
  console.warn('Firebase service account file not found. Push notifications will be disabled.');
  console.warn('To enable FCM, place tracktoto-parent-firebase-adminsdk.json in the project root.');
  firebaseInitialized = false;
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

