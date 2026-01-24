/**
 * Test with route "q" to match working curl command
 */

const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const MONGODB_URI = 'mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test';
const WORKING_API_KEY = 'd1RcqP78gasYGbXtkQOxyShUKJE4D5WMfluzvirFjLmpTNAICofheY9xUvMKadJ85IAlsn2qyGcDXN3k';

async function testWithRouteQ() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const config = await db.collection('configurations').findOne({});
    
    const apiKey = config.fast2smsApiKey ? String(config.fast2smsApiKey).trim() : WORKING_API_KEY.trim();
    
    console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 10));
    console.log('');

    // Test with route "q" (same as working curl)
    const payload = {
      route: "q",
      message: "Test OTP: 123456",
      language: "english",
      flash: 0,
      numbers: "8823823813"
    };

    console.log('📤 Payload (matching curl exactly):');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response Text Length:', responseText.length);
    console.log('📥 Response Text:', responseText);
    console.log('');

    if (responseText && responseText.trim()) {
      const data = JSON.parse(responseText);
      console.log('📋 Parsed Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.return === true) {
        console.log('\n✅ SUCCESS with route "q"!');
      } else {
        console.log('\n❌ Failed with route "q"');
      }
    } else {
      console.log('❌ Empty response with route "q"');
      console.log('\nTrying with working API key directly...\n');
      
      // Try with working API key directly
      const response2 = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': WORKING_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const responseText2 = await response2.text();
      console.log('📥 Response with working key:', responseText2);
      
      if (responseText2 && responseText2.trim()) {
        const data2 = JSON.parse(responseText2);
        if (data2.return === true) {
          console.log('\n✅ SUCCESS with working API key!');
          console.log('   This means the API key in database might be different or corrupted.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testWithRouteQ();

