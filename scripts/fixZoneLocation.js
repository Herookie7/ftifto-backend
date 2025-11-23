/**
 * Script to fix zone location structure
 * 
 * This script updates a zone's location to have the correct GeoJSON Polygon format
 * 
 * Usage: node scripts/fixZoneLocation.js <zoneId> [coordinates]
 * 
 * Example coordinates for Phnom Penh Central:
 * [[[104.8800, 11.5500], [104.9200, 11.5500], [104.9200, 11.5800], [104.8800, 11.5800], [104.8800, 11.5500]]]
 */

const mongoose = require('mongoose');
const Zone = require('../src/models/Zone');
const config = require('../src/config/env');

// Default coordinates for Phnom Penh Central (you should adjust these)
const DEFAULT_COORDINATES = [
  [
    [104.8800, 11.5500], // Southwest corner
    [104.9200, 11.5500], // Southeast corner
    [104.9200, 11.5800], // Northeast corner
    [104.8800, 11.5800], // Northwest corner
    [104.8800, 11.5500]  // Close the polygon
  ]
];

async function fixZoneLocation(zoneId, coordinates = null) {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find the zone
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      console.error(`Zone with ID ${zoneId} not found`);
      process.exit(1);
    }

    console.log('Current zone:', {
      id: zone._id,
      title: zone.title,
      isActive: zone.isActive,
      locationType: zone.location?.type,
      hasCoordinates: !!zone.location?.coordinates,
      coordinates: JSON.stringify(zone.location?.coordinates, null, 2)
    });

    // Use provided coordinates or default
    const coords = coordinates ? JSON.parse(coordinates) : DEFAULT_COORDINATES;

    // Update the zone's location
    zone.location = {
      type: 'Polygon',
      coordinates: coords
    };

    await zone.save();
    console.log('Zone location updated successfully!');
    console.log('Updated zone:', {
      id: zone._id,
      title: zone.title,
      locationType: zone.location.type,
      coordinates: JSON.stringify(zone.location.coordinates, null, 2)
    });

    process.exit(0);
  } catch (error) {
    console.error('Error fixing zone location:', error);
    process.exit(1);
  }
}

// Get command line arguments
const zoneId = process.argv[2];
const coordinates = process.argv[3];

if (!zoneId) {
  console.error('Usage: node scripts/fixZoneLocation.js <zoneId> [coordinates]');
  console.error('Example: node scripts/fixZoneLocation.js 6920b304a283d3f6af374b94');
  console.error('Example with coordinates: node scripts/fixZoneLocation.js 6920b304a283d3f6af374b94 "[[[104.88,11.55],[104.92,11.55],[104.92,11.58],[104.88,11.58],[104.88,11.55]]]"');
  process.exit(1);
}

fixZoneLocation(zoneId, coordinates);

