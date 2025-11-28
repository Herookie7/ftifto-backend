const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('../src/models/Restaurant');
const Zone = require('../src/models/Zone');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

async function verifyMandsaurData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check Zone
    const zone = await Zone.findOne({ title: { $regex: /Mandsaur/i } });
    if (zone) {
      console.log(`📍 Zone: ${zone.title}`);
      console.log(`   Description: ${zone.description}`);
      console.log(`   Active: ${zone.isActive}\n`);
    } else {
      console.log('⚠️  Zone not found\n');
    }

    // Check Restaurants
    const restaurants = await Restaurant.find({ address: { $regex: 'Mandsaur' } }).lean();

    console.log(`🍽️  Restaurants in Mandsaur: ${restaurants.length}\n`);

    for (const rest of restaurants) {
      console.log(`📌 ${rest.name}`);
      console.log(`   Address: ${rest.address}`);
      console.log(`   Type: ${rest.shopType}`);
      console.log(`   Rating: ${rest.rating}`);
      console.log(`   Delivery Time: ${rest.deliveryTime} mins`);
      console.log(`   Min Order: ₹${rest.minimumOrder}`);
      console.log(`   Location: [${rest.location.coordinates[0]}, ${rest.location.coordinates[1]}]`);
      console.log(`   Active: ${rest.isAvailable ? '✅' : '❌'}`);

      // Count categories and products
      const categories = await Category.find({ restaurant: rest._id }).lean();
      const productCount = await Product.countDocuments({ restaurant: rest._id });
      console.log(`   Categories: ${categories.length}, Products: ${productCount}`);
      console.log('');
    }

    // Summary
    const totalCategories = await Category.countDocuments({
      restaurant: { $in: restaurants.map(r => r._id) }
    });
    const totalProducts = await Product.countDocuments({
      restaurant: { $in: restaurants.map(r => r._id) }
    });

    console.log('📊 Summary:');
    console.log(`   Total Restaurants: ${restaurants.length}`);
    console.log(`   Total Categories: ${totalCategories}`);
    console.log(`   Total Products: ${totalProducts}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyMandsaurData();

