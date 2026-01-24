/**
 * Test Fast2SMS with actual database configuration
 * This uses the same code path as your backend
 */

const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test';

// Test phone number (use your number)
const TEST_PHONE = '8823823813';
const TEST_OTP = '123456';

async function testFast2SMSWithConfig() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Load Configuration model (same as backend)
    const Configuration = require('./src/models/Configuration');
    
    // Get configuration (same method as backend)
    const configDoc = await Configuration.getConfiguration();
    
    console.log('📋 Configuration from Database:');
    console.log('  - Enabled:', configDoc.fast2smsEnabled);
    console.log('  - API Key length:', configDoc.fast2smsApiKey ? configDoc.fast2smsApiKey.length : 0);
    console.log('  - Route:', configDoc.fast2smsRoute || 'q');
    console.log('');

    if (!configDoc.fast2smsEnabled) {
      console.log('❌ Fast2SMS is disabled in database');
      process.exit(1);
    }

    if (!configDoc.fast2smsApiKey) {
      console.log('❌ API key not found in database');
      process.exit(1);
    }

    // Use the same trimming logic as the fixed service
    const apiKey = configDoc.fast2smsApiKey ? String(configDoc.fast2smsApiKey).trim() : null;
    console.log('🔑 API Key (trimmed):', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 10));
    console.log('');

    // Normalize phone number (same logic as service)
    const cleaned = String(TEST_PHONE).replace(/\D/g, '');
    const normalized = cleaned.startsWith('91') && cleaned.length === 12 
      ? cleaned.slice(2) 
      : cleaned.slice(-10);
    
    console.log('📱 Phone Number:');
    console.log('  - Original:', TEST_PHONE);
    console.log('  - Normalized:', normalized);
    console.log('');

    if (normalized.length !== 10) {
      console.log('❌ Invalid phone number format');
      process.exit(1);
    }

    // Prepare payload (same as service)
    const route = configDoc.fast2smsRoute || 'q';
    const message = `Your OTP is ${TEST_OTP}. Please do not share this OTP with anyone.`;
    
    const payload = {
      route: route,
      message: message,
      language: 'english',
      flash: 0,
      numbers: normalized
    };

    console.log('📤 Request Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // Make request (same as service)
    const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';
    
    console.log('🚀 Sending request to Fast2SMS...');
    console.log('   URL:', FAST2SMS_API_URL);
    console.log('   Method: POST');
    console.log('   Headers: authorization, Content-Type');
    console.log('');

    const response = await fetch(FAST2SMS_API_URL, {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📥 Response Text:', responseText);
    console.log('');

    if (!responseText || responseText.trim() === '') {
      console.log('❌ Fast2SMS returned EMPTY response!');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. API key is invalid');
      console.log('  2. Account is suspended');
      console.log('  3. Insufficient balance');
      console.log('  4. Network/firewall issue');
      process.exit(1);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
      console.log('   Response:', responseText);
      process.exit(1);
    }

    console.log('📋 Parsed Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data.return === true || data.return === 'true') {
      console.log('✅ SUCCESS! SMS sent successfully!');
      console.log('   Request ID:', data.request_id);
      console.log('   Message:', data.message);
      console.log('');
      console.log('🎉 Fast2SMS is working correctly!');
      console.log('   If OTPs are still not received in the app:');
      console.log('   1. Restart your backend server');
      console.log('   2. Check backend logs when requesting OTP');
      console.log('   3. Verify phone number format in app');
    } else {
      console.log('❌ Fast2SMS returned error:');
      console.log('   Return:', data.return);
      console.log('   Message:', data.message || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testFast2SMSWithConfig();

