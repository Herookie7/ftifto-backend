/**
 * Script to verify zones data in MongoDB
 * 
 * This script checks if zones have the correct format and structure
 * 
 * Usage: node scripts/verifyZones.js
 */

const mongoose = require('mongoose');
const Zone = require('../src/models/Zone');
const config = require('../src/config');
require('dotenv').config();

async function verifyZones() {
  try {
    // Connect to MongoDB
    const mongoUri = config.db.uri || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all zones
    const allZones = await Zone.find({}).lean();
    console.log(`📊 Total zones in database: ${allZones.length}\n`);

    // Get active zones (what the API returns)
    const activeZones = await Zone.find({ isActive: true }).lean();
    console.log(`✅ Active zones (isActive: true): ${activeZones.length}\n`);

    if (activeZones.length === 0) {
      console.log('⚠️  WARNING: No active zones found! Zones must have isActive: true to be returned by the API.\n');
    }

    // Check each zone
    let validZones = 0;
    let invalidZones = 0;

    for (const zone of allZones) {
      console.log(`\n📍 Zone: ${zone.title}`);
      console.log(`   ID: ${zone._id}`);
      console.log(`   isActive: ${zone.isActive ? '✅' : '❌'}`);
      console.log(`   Description: ${zone.description || 'N/A'}`);

      // Check location
      if (!zone.location) {
        console.log('   ❌ ERROR: Missing location field');
        invalidZones++;
        continue;
      }

      console.log(`   Location type: ${zone.location.type || 'N/A'}`);

      // Check coordinates
      if (!zone.location.coordinates) {
        console.log('   ❌ ERROR: Missing coordinates');
        invalidZones++;
        continue;
      }

      const coords = zone.location.coordinates;
      const isArray = Array.isArray(coords);
      console.log(`   Coordinates is array: ${isArray ? '✅' : '❌'}`);

      if (!isArray) {
        console.log('   ❌ ERROR: Coordinates must be an array');
        invalidZones++;
        continue;
      }

      // Check if it's Polygon format (nested arrays)
      if (zone.location.type === 'Polygon') {
        const isNestedArray = Array.isArray(coords[0]);
        const isDoubleNested = isNestedArray && Array.isArray(coords[0][0]);
        console.log(`   Coordinates format: ${isDoubleNested ? 'Polygon (nested) ✅' : 'Invalid ❌'}`);

        if (isDoubleNested && coords[0].length >= 3) {
          console.log(`   Polygon points: ${coords[0].length}`);
          console.log(`   First point: [${coords[0][0][0]}, ${coords[0][0][1]}]`);
          console.log(`   Last point: [${coords[0][coords[0].length - 1][0]}, ${coords[0][coords[0].length - 1][1]}]`);
          
          // Check if polygon is closed (first and last points should be the same)
          const first = coords[0][0];
          const last = coords[0][coords[0].length - 1];
          const isClosed = first[0] === last[0] && first[1] === last[1];
          console.log(`   Polygon closed: ${isClosed ? '✅' : '⚠️  (should be closed)'}`);

          if (isDoubleNested && coords[0].length >= 3) {
            validZones++;
            console.log('   ✅ Zone is valid');
          } else {
            invalidZones++;
            console.log('   ❌ Zone has invalid coordinates format');
          }
        } else {
          invalidZones++;
          console.log('   ❌ Zone coordinates must be in Polygon format: [[[lng, lat], [lng, lat], ...]]');
        }
      } else if (zone.location.type === 'Point') {
        const isValidPoint = coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number';
        console.log(`   Point format: ${isValidPoint ? '✅' : '❌'}`);
        if (isValidPoint) {
          validZones++;
          console.log('   ✅ Zone is valid');
        } else {
          invalidZones++;
        }
      }
    }

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log(`   Total zones: ${allZones.length}`);
    console.log(`   Active zones: ${activeZones.length}`);
    console.log(`   Valid zones: ${validZones}`);
    console.log(`   Invalid zones: ${invalidZones}`);

    if (activeZones.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED: Set isActive: true for zones you want to display');
    }

    if (invalidZones > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Fix invalid zones using scripts/fixZoneLocation.js');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyZones();

