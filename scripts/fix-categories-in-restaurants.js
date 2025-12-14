/**
 * Fix Categories in Restaurants
 * 
 * This script ensures all categories are properly added to their restaurant's categories array.
 * This fixes the issue where categories created before the fix don't appear in restaurant queries.
 * 
 * Usage: node scripts/fix-categories-in-restaurants.js
 */

const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Restaurant = require('../src/models/Restaurant');
const connectDatabase = require('../src/config/database');

const fixCategoriesInRestaurants = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Find all categories
    const categories = await Category.find({});
    console.log(`\n📋 Found ${categories.length} categories to process\n`);

    let fixedCount = 0;
    let alreadyFixedCount = 0;
    let errors = [];

    // Process each category
    for (const category of categories) {
      try {
        const restaurantId = category.restaurant;
        
        // Find the restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        
        if (!restaurant) {
          console.warn(`⚠️  Restaurant not found for category ${category._id} (${category.title})`);
          errors.push({
            categoryId: category._id,
            categoryTitle: category.title,
            error: 'Restaurant not found'
          });
          continue;
        }

        // Check if category is already in restaurant's categories array
        const categoryIdStr = category._id.toString();
        const isInArray = restaurant.categories.some(
          catId => catId.toString() === categoryIdStr
        );

        if (!isInArray) {
          // Add category to restaurant's categories array
          restaurant.categories.push(category._id);
          await restaurant.save();
          console.log(`✅ Fixed: Added "${category.title}" to restaurant "${restaurant.name}"`);
          fixedCount++;
        } else {
          alreadyFixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing category ${category._id}:`, error.message);
        errors.push({
          categoryId: category._id,
          categoryTitle: category.title,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} categories`);
    console.log(`   ✓ Already correct: ${alreadyFixedCount} categories`);
    console.log(`   ❌ Errors: ${errors.length} categories`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Categories with errors:');
      errors.forEach(err => {
        console.log(`   - ${err.categoryTitle} (${err.categoryId}): ${err.error}`);
      });
    }
    
    console.log('='.repeat(50) + '\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
fixCategoriesInRestaurants();
