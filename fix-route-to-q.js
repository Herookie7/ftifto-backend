/**
 * Fix route to "q" (quick) for OTPs
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test';

async function fixRoute() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const config = await db.collection('configurations').findOne({});
    
    console.log('📋 Current Route:', config.fast2smsRoute || 'q (default)');
    console.log('');

    // Update to route "q" (quick) which works for OTPs
    await db.collection('configurations').updateOne(
      { _id: config._id },
      { $set: { fast2smsRoute: 'q' } }
    );

    console.log('✅ Updated route to "q" (quick)');
    console.log('');
    
    // Verify
    const updated = await db.collection('configurations').findOne({ _id: config._id });
    console.log('📋 Updated Route:', updated.fast2smsRoute);
    console.log('');
    console.log('🎉 Route fixed! OTPs should now work correctly.');
    console.log('   Restart your backend server for changes to take effect.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixRoute();

