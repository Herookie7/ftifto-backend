const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const Banner = require('../src/models/Banner');
const connectDatabase = require('../src/config/database');

const addBanners = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Check if banners already exist
    const existingBanners = await Banner.countDocuments();
    if (existingBanners > 0) {
      console.log(`⚠️  ${existingBanners} banner(s) already exist. Skipping...`);
      console.log('💡 To add new banners, delete existing ones first or modify this script.');
      await mongoose.disconnect();
      return;
    }

    console.log('📝 Adding sample banners...');

    // Sample banner data
    const banners = [
      {
        title: 'Welcome to Tifto',
        description: 'Order your favorite food with fast delivery',
        action: 'Navigate',
        screen: 'Menu',
        file: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        parameters: JSON.stringify([
          { key: 'selectedType', value: 'restaurant' },
          { key: 'queryType', value: 'restaurant' }
        ]),
        isActive: true,
        order: 1
      },
      {
        title: 'Special Offers',
        description: 'Get 20% off on your first order',
        action: 'Navigate',
        screen: 'Menu',
        file: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        parameters: JSON.stringify([
          { key: 'selectedType', value: 'restaurant' },
          { key: 'queryType', value: 'topPicks' }
        ]),
        isActive: true,
        order: 2
      },
      {
        title: 'Top Restaurants',
        description: 'Discover the most popular restaurants in your area',
        action: 'Navigate',
        screen: 'Restaurants',
        file: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        parameters: JSON.stringify([
          { key: 'selectedType', value: 'restaurant' },
          { key: 'queryType', value: 'restaurant' }
        ]),
        isActive: true,
        order: 3
      }
    ];

    // Insert banners
    const createdBanners = await Banner.insertMany(banners);
    console.log(`✅ Successfully added ${createdBanners.length} banner(s)!`);

    // Display created banners
    console.log('\n📋 Created Banners:');
    createdBanners.forEach((banner, index) => {
      console.log(`\n${index + 1}. ${banner.title}`);
      console.log(`   Description: ${banner.description}`);
      console.log(`   Action: ${banner.action}`);
      console.log(`   Screen: ${banner.screen}`);
      console.log(`   Order: ${banner.order}`);
      console.log(`   Active: ${banner.isActive}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 Banner seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error adding banners:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  addBanners();
}

module.exports = addBanners;

