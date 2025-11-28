/**
 * Script to update Google Maps API key in MongoDB Configuration
 * 
 * Usage:
 *   node scripts/updateGoogleApiKey.js YOUR_API_KEY_HERE
 * 
 * Example:
 *   node scripts/updateGoogleApiKey.js AIzaSyDfxps4qzL3Hp7Y1_mF6uGuj-Z2ScUHNmk
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const Configuration = require('../src/models/Configuration');

const updateGoogleApiKey = async () => {
  try {
    // Get API key from command line argument
    const apiKey = process.argv[2];
    
    if (!apiKey) {
      console.error('❌ Error: Please provide API key as argument');
      console.error('');
      console.error('Usage:');
      console.error('  node scripts/updateGoogleApiKey.js YOUR_API_KEY_HERE');
      console.error('');
      console.error('Example:');
      console.error('  node scripts/updateGoogleApiKey.js AIzaSyDfxps4qzL3Hp7Y1_mF6uGuj-Z2ScUHNmk');
      process.exit(1);
    }

    // Validate API key format (starts with AIza)
    if (!apiKey.startsWith('AIza')) {
      console.warn('⚠️  Warning: API key does not start with "AIza". Are you sure this is correct?');
      console.warn('   Continuing anyway...');
    }

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI environment variable is required');
      console.error('   Please set it in your .env file or environment');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get or create configuration
    console.log('📋 Getting configuration...');
    const config = await Configuration.getConfiguration();
    
    // Show current key (partially masked)
    if (config.googleApiKey) {
      const maskedKey = config.googleApiKey.length > 10 
        ? `${config.googleApiKey.substring(0, 10)}...` 
        : '***';
      console.log(`📝 Current API key: ${maskedKey}`);
    } else {
      console.log('📝 Current API key: (not set)');
    }

    // Update Google API key
    console.log('💾 Updating Google Maps API key...');
    config.googleApiKey = apiKey;
    await config.save();
    
    console.log('');
    console.log('✅ Success! Google Maps API key updated successfully!');
    console.log(`   New key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log('');
    console.log('📱 Next steps:');
    console.log('   1. Restart your mobile app to fetch the new configuration');
    console.log('   2. Test by clicking on a zone/city in the app');
    console.log('   3. Verify the error "Location services are not properly configured" is gone');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error updating API key:', error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
};

// Run the script
updateGoogleApiKey();

