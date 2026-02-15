const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../src/models/User');
const connectDatabase = require('../src/config/database');

const RIDER_USERNAME = 'anoop.rider@test.com';
const RIDER_PASSWORD = '9827453137@aS';
const RIDER_PHONE = '9827453138'; // Different from seller to avoid unique constraint

const addRider = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Check if rider already exists (by metadata.username or phone)
    const existingRider = await User.findOne({
      $or: [
        { 'metadata.username': RIDER_USERNAME },
        { phone: RIDER_PHONE }
      ]
    });

    if (existingRider) {
      console.log(`⚠️  Rider already exists with username: ${RIDER_USERNAME}`);
      console.log('   Updating password...');

      existingRider.password = RIDER_PASSWORD;
      if (!existingRider.metadata) existingRider.metadata = {};
      existingRider.metadata.username = RIDER_USERNAME;
      if (!existingRider.riderProfile) {
        existingRider.riderProfile = {
          available: true,
          location: { type: 'Point', coordinates: [0, 0] }
        };
      }
      await existingRider.save();

      console.log('✅ Password updated successfully');
      console.log('\n📋 Rider Details:');
      console.log(`   Name: ${existingRider.name}`);
      console.log(`   Username: ${existingRider.metadata?.username}`);
      console.log(`   Phone: ${existingRider.phone || 'Not set'}`);
      console.log(`   Role: ${existingRider.role}`);
      console.log(`   ID: ${existingRider._id}`);

      await mongoose.disconnect();
      return;
    }

    // Create new rider
    console.log('Creating new rider...');
    const rider = await User.create({
      name: 'Anoop Rider',
      phone: RIDER_PHONE,
      password: RIDER_PASSWORD,
      role: 'rider',
      isActive: true,
      metadata: {
        username: RIDER_USERNAME
      },
      riderProfile: {
        available: true,
        location: { type: 'Point', coordinates: [0, 0] }
      }
    });

    console.log('✅ Rider created successfully!');
    console.log('\n📋 Rider Details:');
    console.log(`   Name: ${rider.name}`);
    console.log(`   Username: ${rider.metadata.username}`);
    console.log(`   Phone: ${rider.phone}`);
    console.log(`   Role: ${rider.role}`);
    console.log(`   ID: ${rider._id}`);
    console.log(`   Password: ${RIDER_PASSWORD} (hashed in database)`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - rider with this username or phone already exists');
    }
    process.exit(1);
  }
};

// Run the script
addRider();
