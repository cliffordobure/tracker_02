// FCM Test/Debug Endpoint
// Only enable in development or with proper authentication
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Test FCM Configuration
router.get('/test', async (req, res) => {
  try {
    const diagnostics = {
      initialized: false,
      projectId: null,
      clientEmail: null,
      messagingAvailable: false,
      errors: []
    };

    // Check if Firebase is initialized
    if (admin.apps.length > 0) {
      diagnostics.initialized = true;
      const app = admin.apps[0];
      diagnostics.projectId = app.options.projectId || process.env.FIREBASE_PROJECT_ID;
      diagnostics.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      
      // Check if messaging is available
      try {
        if (admin.messaging) {
          diagnostics.messagingAvailable = true;
        }
      } catch (error) {
        diagnostics.errors.push(`Messaging check failed: ${error.message}`);
      }
    } else {
      diagnostics.errors.push('Firebase Admin SDK not initialized');
    }

    // Check environment variables
    const envVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 
        (process.env.FIREBASE_PRIVATE_KEY.length > 50 ? 'Set (valid length)' : 'Set (too short)') : 
        'Missing'
    };

    // Try to verify project ID matches
    if (process.env.FIREBASE_PROJECT_ID) {
      if (process.env.FIREBASE_PROJECT_ID !== 'tracktoto-7e4ce') {
        diagnostics.errors.push(`Project ID mismatch: Expected 'tracktoto-7e4ce', got '${process.env.FIREBASE_PROJECT_ID}'`);
      }
    }

    res.json({
      success: diagnostics.initialized && diagnostics.messagingAvailable,
      diagnostics,
      environmentVariables: envVars,
      recommendations: diagnostics.errors.length > 0 ? [
        'Check the errors above',
        'Verify FIREBASE_PROJECT_ID matches your Firebase project exactly',
        'Ensure Cloud Messaging API is enabled in Google Cloud Console',
        'Wait 10-15 minutes after enabling API for propagation',
        'Verify service account has proper permissions'
      ] : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test sending a notification to a specific token
router.post('/test-send', async (req, res) => {
  try {
    const { deviceToken } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'deviceToken is required'
      });
    }

    const { sendPushNotificationREST } = require('../services/firebaseService');
    
    const result = await sendPushNotificationREST(
      [deviceToken],
      'Test notification from backend',
      { type: 'test', timestamp: new Date().toISOString() },
      '🧪 Test Notification'
    );

    res.json({
      success: result.success,
      message: result.success 
        ? 'Notification sent successfully. Check your device.' 
        : 'Failed to send notification. Check error details.',
      result: result,
      tokenInfo: {
        tokenLength: deviceToken.length,
        tokenPreview: deviceToken.substring(0, 20) + '...',
        isValidFormat: deviceToken.length > 50 && !deviceToken.toLowerCase().includes('device_token')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

