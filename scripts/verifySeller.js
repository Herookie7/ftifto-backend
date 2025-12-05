const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../src/models/User');
const connectDatabase = require('../src/config/database');

const verifySeller = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    const seller = await User.findOne({ email: 'seller@tifto.test' }).select('+password');
    
    if (!seller) {
      console.log('❌ Seller not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Seller found in database!\n');
    console.log('📋 Seller Details:');
    console.log(`   ID: ${seller._id}`);
    console.log(`   Name: ${seller.name}`);
    console.log(`   Email: ${seller.email}`);
    console.log(`   Phone: ${seller.phone}`);
    console.log(`   Role: ${seller.role}`);
    console.log(`   Is Active: ${seller.isActive}`);
    console.log(`   Email Verified: ${seller.emailIsVerified}`);
    console.log(`   Phone Verified: ${seller.phoneIsVerified}`);
    console.log(`   Password Hash: ${seller.password.substring(0, 20)}...`);
    console.log(`   Created: ${seller.createdAt}`);
    console.log(`   Updated: ${seller.updatedAt}`);

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare('password123', seller.password);
    console.log(`\n🔐 Password Verification:`);
    console.log(`   Password "password123" matches: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifySeller();

