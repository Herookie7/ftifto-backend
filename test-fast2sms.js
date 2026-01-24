/**
 * Test script to verify Fast2SMS integration
 * Run with: node test-fast2sms.js
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name';

async function testFast2SMS() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get configuration
    const Configuration = require('./src/models/Configuration');
    const configDoc = await Configuration.getConfiguration();
    
    console.log('\n📋 Fast2SMS Configuration:');
    console.log('  - Enabled:', configDoc.fast2smsEnabled);
    console.log('  - API Key exists:', !!configDoc.fast2smsApiKey);
    console.log('  - API Key length:', configDoc.fast2smsApiKey ? configDoc.fast2smsApiKey.length : 0);
    console.log('  - API Key (first 20 chars):', configDoc.fast2smsApiKey ? configDoc.fast2smsApiKey.substring(0, 20) + '...' : 'NOT SET');
    console.log('  - Route:', configDoc.fast2smsRoute || 'q (default)');

    if (!configDoc.fast2smsEnabled) {
      console.log('\n❌ Fast2SMS is DISABLED in database. Enable it first!');
      process.exit(1);
    }

    if (!configDoc.fast2smsApiKey) {
      console.log('\n❌ Fast2SMS API key is NOT SET in database.');
      process.exit(1);
    }

    // Test phone number (use your test number)
    const testPhone = '8823823813'; // Replace with your test number
    const testOTP = '123456';
    const testMessage = `Test OTP: ${testOTP}`;

    // Normalize phone number (same logic as service)
    const cleaned = String(testPhone).replace(/\D/g, '');
    const normalized = cleaned.startsWith('91') && cleaned.length === 12 
      ? cleaned.slice(2) 
      : cleaned.slice(-10);
    
    console.log('\n📱 Phone Number:');
    console.log('  - Original:', testPhone);
    console.log('  - Normalized:', normalized);

    if (normalized.length !== 10) {
      console.log('\n❌ Invalid phone number format. Must be 10 digits.');
      process.exit(1);
    }

    // Prepare request (exactly as backend does)
    const payload = {
      route: configDoc.fast2smsRoute || 'q',
      message: testMessage,
      language: 'english',
      flash: 0,
      numbers: normalized
    };

    console.log('\n📤 Request Payload:');
    console.log(JSON.stringify(payload, null, 2));

    // Make request (exactly as backend does)
    const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';
    
    console.log('\n🚀 Sending request to Fast2SMS...');
    const response = await fetch(FAST2SMS_API_URL, {
      method: 'POST',
      headers: {
        'authorization': configDoc.fast2smsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📥 Response:');
    console.log('  - Status:', response.status, response.statusText);
    console.log('  - Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('  - Response Text:', responseText);

    if (!responseText || responseText.trim() === '') {
      console.log('\n❌ Fast2SMS returned EMPTY response!');
      console.log('   This usually means:');
      console.log('   1. API key is invalid');
      console.log('   2. Account is suspended');
      console.log('   3. Insufficient balance');
      process.exit(1);
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('  - Parsed JSON:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\n❌ Failed to parse JSON response:', e.message);
      process.exit(1);
    }

    if (data.return === true || data.return === 'true') {
      console.log('\n✅ SUCCESS! SMS sent successfully!');
      console.log('  - Request ID:', data.request_id);
      console.log('  - Message:', data.message);
    } else {
      console.log('\n❌ Fast2SMS returned error:');
      console.log('  - Return:', data.return);
      console.log('  - Message:', data.message || 'Unknown error');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testFast2SMS();

