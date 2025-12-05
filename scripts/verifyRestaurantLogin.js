const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const Restaurant = require('../src/models/Restaurant');
const User = require('../src/models/User');
const connectDatabase = require('../src/config/database');

const verifyRestaurantLogin = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    const username = 'seller@tifto.test';
    const password = 'password123';

    // Simulate the restaurantLogin query
    const restaurant = await Restaurant.findOne({ username, password }).lean();
    
    if (!restaurant) {
      console.log('❌ Restaurant login failed - credentials not found');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}\n`);
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Restaurant found!\n');
    console.log('📋 Restaurant Details:');
    console.log(`   ID: ${restaurant._id}`);
    console.log(`   Name: ${restaurant.name}`);
    console.log(`   Username: ${restaurant.username}`);
    console.log(`   Password: ${restaurant.password}`);
    console.log(`   Is Active: ${restaurant.isActive}`);
    console.log(`   Owner ID: ${restaurant.owner}\n`);

    // Get the owner
    const owner = await User.findById(restaurant.owner);
    if (!owner) {
      console.log('❌ Restaurant owner not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Owner found!\n');
    console.log('📋 Owner Details:');
    console.log(`   ID: ${owner._id}`);
    console.log(`   Name: ${owner.name}`);
    console.log(`   Email: ${owner.email}`);
    console.log(`   Role: ${owner.role}`);
    console.log(`   Is Active: ${owner.isActive}\n`);

    if (!restaurant.isActive) {
      console.log('⚠️  Restaurant account is deactivated');
    } else if (owner.isActive === false) {
      console.log('⚠️  Owner account is deactivated');
    } else {
      console.log('✅ Login credentials are valid!');
      console.log('   The seller can now log in with:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyRestaurantLogin();

