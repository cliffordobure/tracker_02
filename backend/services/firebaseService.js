// Firebase Admin SDK service for push notifications
// Uncomment and configure when Firebase credentials are available

/*
const admin = require('firebase-admin');
const serviceAccount = require('../tracktoto-parent-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const sendPushNotification = async (deviceTokens, message, data = {}) => {
  try {
    const messageObj = {
      notification: {
        title: 'School Bus Tracker',
        body: message,
      },
      data: {
        ...data,
        message: message,
      },
      tokens: Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens],
    };

    const response = await admin.messaging().sendMulticast(messageObj);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

module.exports = { sendPushNotification };
*/

// Placeholder function for when Firebase is not configured
const sendPushNotification = async (deviceTokens, message, data = {}) => {
  console.log('Push notification service not configured');
  console.log('Would send to:', deviceTokens);
  console.log('Message:', message);
  return { success: false, message: 'Firebase not configured' };
};

module.exports = { sendPushNotification };

