# Zone Data Management Scripts

This directory contains scripts to verify and fix zone data in MongoDB.

## Scripts

### 1. `verifyZones.js` - Verify Zone Data
Checks all zones in the database and reports their status.

**Usage:**
```bash
cd ftifto-backend
node scripts/verifyZones.js
```

**What it checks:**
- Total zones in database
- Active zones (isActive: true)
- Location structure
- Coordinates format
- Polygon closure

### 2. `fixAllZones.js` - Automatically Fix Zone Issues
Automatically fixes common issues with zones.

**Usage:**
```bash
# Dry run (see what would be changed)
node scripts/fixAllZones.js --dry-run

# Actually fix the issues
node scripts/fixAllZones.js
```

**What it fixes:**
- Sets `isActive: true` for all zones
- Ensures `location.type` is set (defaults to 'Polygon')
- Fixes coordinates format (converts Point to Polygon if needed)
- Closes polygons if they're not closed

### 3. `fixZoneLocation.js` - Fix Individual Zone
Fixes a specific zone's location.

**Usage:**
```bash
node scripts/fixZoneLocation.js <zoneId> "[coordinates]"
```

**Example:**
```bash
node scripts/fixZoneLocation.js 507f1f77bcf86cd799439011 "[[[104.8800, 11.5500], [104.9200, 11.5500], [104.9200, 11.5800], [104.8800, 11.5800], [104.8800, 11.5500]]]"
```

### 4. `addCities.js` - Add/Update City Zones
Adds or updates zones for predefined cities.

**Usage:**
```bash
node scripts/addCities.js
```

## Zone Data Format

Zones must have the following structure:

```javascript
{
  title: "City Name",
  description: "Delivery zone for City Name",
  isActive: true,  // Must be true to appear in API
  location: {
    type: "Polygon",  // Should be 'Polygon' for zones
    coordinates: [
      [
        [lng1, lat1],  // First point
        [lng2, lat2],  // Second point
        [lng3, lat3],  // Third point
        [lng1, lat1]   // Close polygon (same as first point)
      ]
    ]
  },
  tax: 0
}
```

**Important:**
- `coordinates` must be a nested array: `[[[lng, lat], ...]]`
- Polygon must have at least 3 points
- First and last points should be the same (closed polygon)
- Coordinates are in [longitude, latitude] format (not lat, lng)

## Common Issues and Solutions

### Issue 1: Zones not appearing in API
**Problem:** Zones have `isActive: false`

**Solution:**
```bash
node scripts/fixAllZones.js
```

### Issue 2: Invalid coordinates format
**Problem:** Coordinates are not in Polygon format

**Solution:**
```bash
# Check what's wrong
node scripts/verifyZones.js

# Auto-fix if possible
node scripts/fixAllZones.js

# Or fix manually
node scripts/fixZoneLocation.js <zoneId> "[coordinates]"
```

### Issue 3: Missing zones
**Problem:** No zones in database

**Solution:**
```bash
# Add predefined cities
node scripts/addCities.js
```

## Environment Variables

Make sure you have MongoDB connection string set:
- `MONGO_URI` or `MONGODB_URI` in your `.env` file

## Workflow

1. **First, verify zones:**
   ```bash
   node scripts/verifyZones.js
   ```

2. **If issues found, try auto-fix:**
   ```bash
   node scripts/fixAllZones.js --dry-run  # Preview changes
   node scripts/fixAllZones.js            # Apply changes
   ```

3. **Verify again:**
   ```bash
   node scripts/verifyZones.js
   ```

4. **If zones are missing, add them:**
   ```bash
   node scripts/addCities.js
   ```

