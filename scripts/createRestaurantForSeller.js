const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const connectDatabase = require('../src/config/database');

const createRestaurantForSeller = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Find the seller user
    const seller = await User.findOne({ email: 'seller@tifto.test' });
    
    if (!seller) {
      console.log('❌ Seller user not found. Please create the seller first.');
      console.log('   Run: node scripts/addSeller.js');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found seller: ${seller.name} (${seller.email})\n`);

    // Check if restaurant already exists for this seller
    const existingRestaurant = await Restaurant.findOne({ owner: seller._id });
    
    if (existingRestaurant) {
      console.log('⚠️  Restaurant already exists for this seller');
      console.log(`   Restaurant ID: ${existingRestaurant._id}`);
      console.log(`   Name: ${existingRestaurant.name}`);
      console.log(`   Username: ${existingRestaurant.username || 'Not set'}`);
      console.log(`   Password: ${existingRestaurant.password ? '***' : 'Not set'}\n`);
      
      // Update username and password if not set
      if (!existingRestaurant.username || !existingRestaurant.password) {
        console.log('📝 Updating restaurant credentials...');
        existingRestaurant.username = 'seller@tifto.test';
        existingRestaurant.password = 'password123';
        await existingRestaurant.save();
        console.log('✅ Restaurant credentials updated!');
        console.log(`   Username: ${existingRestaurant.username}`);
        console.log(`   Password: password123\n`);
      } else {
        console.log('✅ Restaurant credentials are already set\n');
      }

      await mongoose.disconnect();
      return;
    }

    // Create new restaurant
    console.log('Creating restaurant for seller...');
    const restaurant = await Restaurant.create({
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      address: '123 Restaurant Street, Demo City',
      location: {
        type: 'Point',
        coordinates: [104.902, 11.556] // Default coordinates
      },
      phone: seller.phone || '1000000002',
      owner: seller._id,
      username: 'seller@tifto.test', // Login username
      password: 'password123', // Login password (stored as plain text in Restaurant model)
      isActive: true,
      isAvailable: true,
      deliveryTime: 30,
      minimumOrder: 0,
      tax: 0,
      rating: 0,
      openingTimes: [
        {
          day: 'Monday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        },
        {
          day: 'Tuesday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        },
        {
          day: 'Wednesday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        },
        {
          day: 'Thursday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        },
        {
          day: 'Friday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        },
        {
          day: 'Saturday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        },
        {
          day: 'Sunday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        }
      ]
    });

    // Update seller profile to link restaurant
    seller.sellerProfile = {
      businessName: restaurant.name,
      restaurant: restaurant._id
    };
    await seller.save();

    console.log('✅ Restaurant created successfully!\n');
    console.log('📋 Restaurant Details:');
    console.log(`   ID: ${restaurant._id}`);
    console.log(`   Name: ${restaurant.name}`);
    console.log(`   Address: ${restaurant.address}`);
    console.log(`   Username: ${restaurant.username}`);
    console.log(`   Password: ${restaurant.password}`);
    console.log(`   Owner: ${seller.name} (${seller.email})`);
    console.log(`   Is Active: ${restaurant.isActive}`);
    console.log(`   Is Available: ${restaurant.isAvailable}\n`);

    console.log('✅ Seller profile updated with restaurant link\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - restaurant with this slug or username already exists');
    }
    process.exit(1);
  }
};

// Run the script
createRestaurantForSeller();

