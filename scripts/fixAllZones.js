/**
 * Script to automatically fix common issues with zones in MongoDB
 * 
 * This script will:
 * 1. Set isActive: true for all zones (so they appear in the API)
 * 2. Fix coordinates format if needed
 * 3. Ensure location.type is set correctly
 * 4. Close polygons if they're not closed
 * 
 * Usage: node scripts/fixAllZones.js [--dry-run]
 * 
 * Use --dry-run to see what would be changed without actually making changes
 */

const mongoose = require('mongoose');
const Zone = require('../src/models/Zone');
const config = require('../src/config');
require('dotenv').config();

async function fixAllZones(dryRun = false) {
  try {
    // Connect to MongoDB
    const mongoUri = config.db.uri || config.MONGODB_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB\n');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Get all zones
    const allZones = await Zone.find({});
    console.log(`📊 Total zones found: ${allZones.length}\n`);

    let fixedCount = 0;
    let needsFix = 0;

    for (const zone of allZones) {
      let needsUpdate = false;
      const updates = [];

      console.log(`\n📍 Zone: ${zone.title} (${zone._id})`);

      // Fix 1: Ensure isActive is true
      if (!zone.isActive) {
        console.log('   ⚠️  isActive is false - will set to true');
        zone.isActive = true;
        needsUpdate = true;
        updates.push('isActive: true');
      }

      // Fix 2: Ensure location exists
      if (!zone.location) {
        console.log('   ❌ Missing location - cannot fix automatically');
        needsFix++;
        continue;
      }

      // Fix 3: Ensure location.type is set (default to Polygon)
      if (!zone.location.type) {
        console.log('   ⚠️  Missing location.type - will set to Polygon');
        zone.location.type = 'Polygon';
        needsUpdate = true;
        updates.push('location.type: Polygon');
      }

      // Fix 4: Fix coordinates format
      if (!zone.location.coordinates) {
        console.log('   ❌ Missing coordinates - cannot fix automatically');
        needsFix++;
        continue;
      }

      const coords = zone.location.coordinates;
      const isArray = Array.isArray(coords);

      if (!isArray) {
        console.log('   ❌ Coordinates is not an array - cannot fix automatically');
        needsFix++;
        continue;
      }

      // Fix Polygon coordinates format
      if (zone.location.type === 'Polygon') {
        // Check if it's in the correct nested format
        const isNested = Array.isArray(coords[0]);
        const isDoubleNested = isNested && Array.isArray(coords[0][0]);

        if (!isDoubleNested) {
          // Try to fix: if it's a flat array of points, wrap it
          if (isNested && coords[0].length === 2 && typeof coords[0][0] === 'number') {
            // It's a single point, create a small polygon around it
            const [lng, lat] = coords[0];
            const radius = 0.01; // ~1km
            zone.location.coordinates = [[
              [lng - radius, lat - radius],
              [lng + radius, lat - radius],
              [lng + radius, lat + radius],
              [lng - radius, lat + radius],
              [lng - radius, lat - radius] // Close polygon
            ]];
            console.log('   ⚠️  Fixed: Converted Point to Polygon');
            needsUpdate = true;
            updates.push('coordinates: Point -> Polygon');
          } else if (!isNested && coords.length === 2 && typeof coords[0] === 'number') {
            // It's a single [lng, lat] point
            const [lng, lat] = coords;
            const radius = 0.01;
            zone.location.coordinates = [[
              [lng - radius, lat - radius],
              [lng + radius, lat - radius],
              [lng + radius, lat + radius],
              [lng - radius, lat + radius],
              [lng - radius, lat - radius]
            ]];
            console.log('   ⚠️  Fixed: Converted Point coordinates to Polygon');
            needsUpdate = true;
            updates.push('coordinates: Point -> Polygon');
          } else {
            console.log('   ❌ Invalid coordinates format - cannot auto-fix');
            needsFix++;
            continue;
          }
        } else {
          // Check if polygon is closed
          const polygon = coords[0];
          if (polygon.length >= 3) {
            const first = polygon[0];
            const last = polygon[polygon.length - 1];
            const isClosed = first[0] === last[0] && first[1] === last[1];

            if (!isClosed) {
              console.log('   ⚠️  Polygon not closed - will close it');
              // Close the polygon by adding the first point at the end
              zone.location.coordinates = [polygon.concat([first])];
              needsUpdate = true;
              updates.push('closed polygon');
            }
          }
        }
      }

      // Save if updates are needed
      if (needsUpdate) {
        if (dryRun) {
          console.log(`   🔍 Would update: ${updates.join(', ')}`);
        } else {
          await zone.save();
          console.log(`   ✅ Fixed: ${updates.join(', ')}`);
          fixedCount++;
        }
      } else {
        console.log('   ✅ Zone is valid');
      }
    }

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log(`   Total zones: ${allZones.length}`);
    if (dryRun) {
      console.log(`   Zones that would be fixed: ${fixedCount}`);
      console.log(`   Zones that need manual fixing: ${needsFix}`);
      console.log('\n💡 Run without --dry-run to apply fixes');
    } else {
      console.log(`   Zones fixed: ${fixedCount}`);
      console.log(`   Zones that need manual fixing: ${needsFix}`);
    }

    // Verify active zones
    const activeZones = await Zone.find({ isActive: true });
    console.log(`\n✅ Active zones after fix: ${activeZones.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Check for dry-run flag
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

fixAllZones(dryRun);

