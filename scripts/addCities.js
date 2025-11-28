const mongoose = require('mongoose');
const Zone = require('../src/models/Zone');
require('dotenv').config();

// Use the same config system as the main app
const config = require('../src/config');

// City coordinates (latitude, longitude)
// Polygon format for GeoJSON: [[[longitude, latitude], ...]] - must be closed
const cities = [
  {
    name: 'Mandsaur',
    latitude: 24.0718,
    longitude: 75.0699,
    // Create a simple square polygon around the city center (approximately 10km radius)
    polygon: [
      [75.0699 - 0.1, 24.0718 - 0.1], // Southwest
      [75.0699 + 0.1, 24.0718 - 0.1], // Southeast
      [75.0699 + 0.1, 24.0718 + 0.1], // Northeast
      [75.0699 - 0.1, 24.0718 + 0.1], // Northwest
      [75.0699 - 0.1, 24.0718 - 0.1]  // Close the polygon
    ]
  },
  {
    name: 'Neemuch',
    latitude: 24.4700,
    longitude: 74.8700,
    polygon: [
      [74.8700 - 0.1, 24.4700 - 0.1],
      [74.8700 + 0.1, 24.4700 - 0.1],
      [74.8700 + 0.1, 24.4700 + 0.1],
      [74.8700 - 0.1, 24.4700 + 0.1],
      [74.8700 - 0.1, 24.4700 - 0.1]
    ]
  },
  {
    name: 'Ujjain',
    latitude: 23.1765,
    longitude: 75.7885,
    polygon: [
      [75.7885 - 0.1, 23.1765 - 0.1],
      [75.7885 + 0.1, 23.1765 - 0.1],
      [75.7885 + 0.1, 23.1765 + 0.1],
      [75.7885 - 0.1, 23.1765 + 0.1],
      [75.7885 - 0.1, 23.1765 - 0.1]
    ]
  }
];

async function addCities() {
  try {
    // Connect to MongoDB using the same config as the main app
    const mongoUri = config.db.uri;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required. Please set it in your .env file.');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');

    // Check if cities already exist and add/update them
    for (const city of cities) {
      const existingZone = await Zone.findOne({ title: city.name });
      if (existingZone) {
        console.log(`\nZone "${city.name}" already exists. Updating...`);
        existingZone.location = {
          type: 'Polygon',
          coordinates: [city.polygon]
        };
        existingZone.isActive = true;
        existingZone.description = `Delivery zone for ${city.name}`;
        await existingZone.save();
        console.log(`✅ Updated zone: ${city.name}`);
      } else {
        // Create new zone
        const zone = new Zone({
          title: city.name,
          description: `Delivery zone for ${city.name}`,
          location: {
            type: 'Polygon',
            coordinates: [city.polygon]
          },
          tax: 0,
          isActive: true
        });
        await zone.save();
        console.log(`✅ Created zone: ${city.name}`);
      }
    }

    console.log('\n✅ Successfully added/updated all cities!');
    console.log('\nCities added:');
    cities.forEach(city => {
      console.log(`  - ${city.name} (Lat: ${city.latitude}, Lng: ${city.longitude})`);
    });

    // Verify the zones
    const allZones = await Zone.find({ isActive: true });
    console.log(`\n📊 Total active zones in database: ${allZones.length}`);
    allZones.forEach(zone => {
      console.log(`  - ${zone.title}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding cities:', error);
    process.exit(1);
  }
}

// Run the script
addCities();
