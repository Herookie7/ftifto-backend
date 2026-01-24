/**
 * Script to check and fix Fast2SMS configuration in MongoDB
 * Run with: node check-and-fix-fast2sms-config.js
 */

const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test';

// Working API key from your curl command
const WORKING_API_KEY = 'd1RcqP78gasYGbXtkQOxyShUKJE4D5WMfluzvirFjLmpTNAICofheY9xUvMKadJ85IAlsn2qyGcDXN3k';

async function checkAndFixConfig() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Configuration model (assuming it exists)
    const db = mongoose.connection.db;
    const configurationsCollection = db.collection('configurations');
    
    // Find configuration document
    let config = await configurationsCollection.findOne({});
    
    if (!config) {
      console.log('❌ No configuration document found. Creating one...');
      config = {
        fast2smsEnabled: false,
        fast2smsApiKey: null,
        fast2smsRoute: 'q'
      };
      await configurationsCollection.insertOne(config);
      console.log('✅ Created new configuration document\n');
    }

    console.log('📋 Current Fast2SMS Configuration:');
    console.log('  - Enabled:', config.fast2smsEnabled || false);
    console.log('  - API Key exists:', !!config.fast2smsApiKey);
    console.log('  - API Key length:', config.fast2smsApiKey ? config.fast2smsApiKey.length : 0);
    console.log('  - API Key (first 20 chars):', config.fast2smsApiKey ? config.fast2smsApiKey.substring(0, 20) + '...' : 'NOT SET');
    console.log('  - Route:', config.fast2smsRoute || 'q (default)');
    console.log('');

    // Check if API key matches working one
    const currentApiKey = config.fast2smsApiKey ? String(config.fast2smsApiKey).trim() : null;
    const workingApiKey = WORKING_API_KEY.trim();
    const apiKeyMatches = currentApiKey === workingApiKey;

    console.log('🔍 Analysis:');
    if (!config.fast2smsEnabled) {
      console.log('  ⚠️  Fast2SMS is DISABLED');
    } else {
      console.log('  ✅ Fast2SMS is ENABLED');
    }

    if (!currentApiKey) {
      console.log('  ⚠️  API Key is NOT SET');
    } else if (apiKeyMatches) {
      console.log('  ✅ API Key matches working key from curl');
    } else {
      console.log('  ⚠️  API Key does NOT match working key from curl');
      console.log('     Current:', currentApiKey ? currentApiKey.substring(0, 20) + '...' : 'NOT SET');
      console.log('     Working:', workingApiKey.substring(0, 20) + '...');
    }

    console.log('');

    // Determine what needs to be fixed
    const needsUpdate = !config.fast2smsEnabled || !apiKeyMatches || !currentApiKey;

    if (needsUpdate) {
      console.log('🔧 Fixing configuration...');
      
      const updateData = {
        fast2smsEnabled: true,
        fast2smsApiKey: workingApiKey,
        fast2smsRoute: config.fast2smsRoute || 'q'
      };

      await configurationsCollection.updateOne(
        { _id: config._id },
        { $set: updateData }
      );

      console.log('✅ Configuration updated successfully!\n');
      console.log('📋 Updated Configuration:');
      console.log('  - Enabled: true');
      console.log('  - API Key: ' + workingApiKey.substring(0, 20) + '...' + workingApiKey.substring(workingApiKey.length - 10));
      console.log('  - Route:', updateData.fast2smsRoute);
      console.log('');
    } else {
      console.log('✅ Configuration is already correct! No changes needed.\n');
    }

    // Verify the update
    const updatedConfig = await configurationsCollection.findOne({ _id: config._id });
    console.log('✅ Verification:');
    console.log('  - Enabled:', updatedConfig.fast2smsEnabled);
    console.log('  - API Key exists:', !!updatedConfig.fast2smsApiKey);
    console.log('  - API Key matches:', updatedConfig.fast2smsApiKey ? String(updatedConfig.fast2smsApiKey).trim() === workingApiKey : false);
    console.log('');

    console.log('🎉 Done! Your Fast2SMS configuration is now set up correctly.');
    console.log('   Restart your backend server for changes to take effect.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkAndFixConfig();

