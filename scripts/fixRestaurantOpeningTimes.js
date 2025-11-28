const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('../src/models/Restaurant');

// Day name mapping
const dayMapping = {
  'Monday': 'MON',
  'Tuesday': 'TUE',
  'Wednesday': 'WED',
  'Thursday': 'THU',
  'Friday': 'FRI',
  'Saturday': 'SAT',
  'Sunday': 'SUN'
};

async function fixRestaurantOpeningTimes() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all restaurants with opening times
    const restaurants = await Restaurant.find({ openingTimes: { $exists: true, $ne: [] } });

    console.log(`Found ${restaurants.length} restaurants to update\n`);

    let updatedCount = 0;

    for (const restaurant of restaurants) {
      let needsUpdate = false;
      const updatedOpeningTimes = restaurant.openingTimes.map(openingTime => {
        // Check if day name needs to be converted
        if (dayMapping[openingTime.day]) {
          needsUpdate = true;
          return {
            ...openingTime.toObject(),
            day: dayMapping[openingTime.day]
          };
        }
        return openingTime;
      });

      if (needsUpdate) {
        restaurant.openingTimes = updatedOpeningTimes;
        await restaurant.save();
        updatedCount++;
        console.log(`✅ Updated: ${restaurant.name}`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} restaurants`);
    console.log('✅ All restaurants now use abbreviated day names (MON, TUE, etc.)');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error fixing restaurant opening times:', error);
    process.exit(1);
  }
}

fixRestaurantOpeningTimes();

