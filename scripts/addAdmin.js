const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../src/models/User');
const connectDatabase = require('../src/config/database');

const addAdmin = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'herookie@tensi.org';
    const adminPassword = '9827453137';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminEmail }
      ]
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin already exists with email: ${adminEmail}`);
      console.log('   Updating password...');
      
      // Update password (will be hashed by pre-save hook)
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.emailIsVerified = true;
      existingAdmin.phoneIsVerified = true;
      await existingAdmin.save();
      
      console.log('✅ Admin password and details updated successfully');
      console.log('\n📋 Admin Details:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Phone: ${existingAdmin.phone || 'Not set'}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   ID: ${existingAdmin._id}`);
      console.log(`   Is Active: ${existingAdmin.isActive}`);
      
      await mongoose.disconnect();
      return;
    }

    // Create new admin
    console.log('Creating new admin user...');
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Will be hashed automatically by pre-save hook
      role: 'admin',
      isActive: true,
      phoneIsVerified: true,
      emailIsVerified: true
    });

    console.log('✅ Admin created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Phone: ${admin.phone || 'Not set'}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);
    console.log(`   Is Active: ${admin.isActive}`);
    console.log(`   Email Verified: ${admin.emailIsVerified}`);
    console.log(`   Phone Verified: ${admin.phoneIsVerified}`);
    console.log(`   Password: ${adminPassword} (hashed in database)`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

addAdmin();

