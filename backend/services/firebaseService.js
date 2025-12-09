// Firebase Admin SDK service for push notifications
const admin = require('firebase-admin');
const path = require('path');
const https = require('https');
const { URL } = require('url');

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
      // Initialize with explicit project configuration
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        // Explicitly set the database URL to ensure proper project association
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully from environment variables');
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email}`);
      
      // Verify messaging is available and test connection
      try {
        if (admin.messaging) {
          console.log('✅ Firebase Messaging API is available');
          
          // Try to get messaging instance to verify it's working
          const messaging = admin.messaging();
          console.log('✅ Firebase Messaging instance created successfully');
        } else {
          console.warn('⚠️  Firebase Messaging API not available - may need to enable Cloud Messaging API');
        }
      } catch (error) {
        console.warn('⚠️  Could not verify Messaging API:', error.message);
      }
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

    // Log the request details for debugging
    const projectId = admin.apps[0]?.options?.projectId || process.env.FIREBASE_PROJECT_ID;
    console.log('📤 Sending FCM notification:', {
      projectId: projectId,
      tokenCount: validTokens.length,
      title: title,
      message: message.substring(0, 50) + '...',
      usingAPI: 'Firebase Admin SDK v' + require('firebase-admin/package.json').version
    });

    // Get messaging instance
    const messaging = admin.messaging();
    
    // Try to send using multicast
    // If this fails with 404, we'll fall back to REST API
    let response;
    try {
      response = await messaging.sendMulticast(messageObj);
    } catch (sdkError) {
      // If SDK fails with 404 on /batch endpoint, try REST API v1 directly
      if (sdkError.code === 'messaging/unknown-error' && sdkError.message.includes('404') && sdkError.message.includes('/batch')) {
        console.warn('⚠️  SDK using legacy /batch endpoint failed. Trying REST API v1 directly...');
        return await sendPushNotificationREST(validTokens, message, data, title);
      }
      throw sdkError; // Re-throw if it's a different error
    }
    
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
    // Log full error details for debugging
    console.error('❌ FCM Error Details:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Error Info:', JSON.stringify(error.errorInfo || {}, null, 2));
    
    // Handle specific Firebase errors
    if (error.code === 'messaging/unknown-error' && error.message.includes('404')) {
      console.error('❌ Firebase Cloud Messaging API Error (404):');
      console.error('   Project ID:', admin.apps[0]?.options?.projectId || process.env.FIREBASE_PROJECT_ID);
      console.error('   Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
      console.error('   This usually means:');
      console.error('   1. API endpoint not found (wrong project ID or API not fully enabled)');
      console.error('   2. Service account lacks permissions for FCM API');
      console.error('   3. Billing not enabled (some regions require billing)');
      console.error('   4. API enabled but not fully propagated (wait 15-30 minutes)');
      
      // Check if it's a billing issue
      if (error.message.includes('billing') || error.message.includes('quota')) {
        console.error('   💡 This might be a billing/quota issue. Check Google Cloud Console billing.');
      }
      
      return { 
        success: false, 
        message: 'Firebase Cloud Messaging API returned 404. Check project ID, permissions, and billing.',
        error: 'FCM_API_NOT_ENABLED',
        code: error.code,
        details: {
          projectId: admin.apps[0]?.options?.projectId || process.env.FIREBASE_PROJECT_ID,
          errorCode: error.code,
          rawError: error.message.substring(0, 200)
        }
      };
    }
    
    // Handle other specific errors
    if (error.code === 'messaging/invalid-argument') {
      console.error('❌ Invalid argument error - check device tokens are valid FCM tokens');
    }
    
    if (error.code === 'messaging/authentication-error') {
      console.error('❌ Authentication error - check service account credentials');
    }
    
    console.error('Error sending push notification:', error.message || error);
    return { 
      success: false, 
      message: error.message || 'Unknown error', 
      error: error,
      code: error.code
    };
  }
};

// Helper function to get access token for REST API
const getAccessToken = async () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Use Firebase Admin SDK to get access token
    const app = admin.apps[0];
    if (!app || !app.options || !app.options.credential) {
      throw new Error('Firebase app not properly initialized');
    }
    
    // Get access token from credential
    const accessTokenResponse = await app.options.credential.getAccessToken();
    if (!accessTokenResponse || !accessTokenResponse.access_token) {
      throw new Error('Failed to get access token');
    }
    
    return accessTokenResponse.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    throw error;
  }
};

// Alternative: Send using FCM REST API v1 directly (bypasses SDK endpoint issues)
const sendPushNotificationREST = async (deviceTokens, message, data = {}, title = 'School Bus Tracker') => {
  if (!firebaseInitialized) {
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const projectId = admin.apps[0]?.options?.projectId || process.env.FIREBASE_PROJECT_ID;
    const validTokens = Array.isArray(deviceTokens) 
      ? deviceTokens.filter(token => token && token.trim() !== '' && token.length > 50)
      : (deviceTokens && deviceTokens.trim() !== '' && deviceTokens.length > 50 ? [deviceTokens] : []);

    if (validTokens.length === 0) {
      return { success: false, message: 'No valid device tokens' };
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Send to each token using v1 API
    const results = [];
    for (const token of validTokens) {
      try {
        const messagePayload = {
          message: {
            token: token,
            notification: {
              title: title,
              body: message
            },
            data: {
              ...data,
              message: message,
              timestamp: new Date().toISOString()
            }
          }
        };

        // Use Node.js https module to call FCM REST API v1
        const apiUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        const url = new URL(apiUrl);
        
        const result = await new Promise((resolve, reject) => {
          const postData = JSON.stringify(messagePayload);
          
          const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                resolve({ success: res.statusCode === 200, statusCode: res.statusCode, data: parsed });
              } catch (e) {
                resolve({ success: false, statusCode: res.statusCode, data: data });
              }
            });
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.write(postData);
          req.end();
        });
        
        if (result.success) {
          results.push({ success: true, token, result: result.data });
        } else {
          results.push({ success: false, token, error: result.data });
        }
      } catch (error) {
        results.push({ success: false, token, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    if (failureCount > 0) {
      console.warn(`FCM REST API: ${failureCount} notifications failed out of ${successCount + failureCount}`);
    } else {
      console.log(`✅ FCM REST API: Successfully sent ${successCount} notifications`);
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    console.error('Error sending via REST API:', error);
    return { success: false, message: error.message, error: error };
  }
};

// Helper function to send notification to a single device
const sendToDevice = async (deviceToken, message, data = {}, title = 'School Bus Tracker') => {
  return sendPushNotification([deviceToken], message, data, title);
};

module.exports = { sendPushNotification, sendToDevice, sendPushNotificationREST };

