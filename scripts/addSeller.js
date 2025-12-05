const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../src/models/User');
const connectDatabase = require('../src/config/database');

const addSeller = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Check if seller already exists
    const existingSeller = await User.findOne({ 
      $or: [
        { email: 'seller@tifto.test' },
        { phone: '1000000002' }
      ]
    });

    if (existingSeller) {
      console.log('⚠️  Seller already exists with email: seller@tifto.test');
      console.log('   Updating password...');
      
      // Update password (will be hashed by pre-save hook)
      existingSeller.password = 'password123';
      await existingSeller.save();
      
      console.log('✅ Password updated successfully');
      console.log('\n📋 Seller Details:');
      console.log(`   Name: ${existingSeller.name}`);
      console.log(`   Email: ${existingSeller.email}`);
      console.log(`   Phone: ${existingSeller.phone || 'Not set'}`);
      console.log(`   Role: ${existingSeller.role}`);
      console.log(`   ID: ${existingSeller._id}`);
      
      await mongoose.disconnect();
      return;
    }

    // Create new seller
    console.log('Creating new seller...');
    const seller = await User.create({
      name: 'Seller User',
      email: 'seller@tifto.test',
      phone: '1000000002',
      password: 'password123', // Will be hashed automatically by pre-save hook
      role: 'seller',
      isActive: true,
      phoneIsVerified: true,
      emailIsVerified: true
    });

    console.log('✅ Seller created successfully!');
    console.log('\n📋 Seller Details:');
    console.log(`   Name: ${seller.name}`);
    console.log(`   Email: ${seller.email}`);
    console.log(`   Phone: ${seller.phone}`);
    console.log(`   Role: ${seller.role}`);
    console.log(`   ID: ${seller._id}`);
    console.log(`   Password: password123 (hashed in database)`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - seller with this email or phone already exists');
    }
    process.exit(1);
  }
};

// Run the script
addSeller();

