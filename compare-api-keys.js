/**
 * Compare API keys to find differences
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test';
const WORKING_API_KEY = 'd1RcqP78gasYGbXtkQOxyShUKJE4D5WMfluzvirFjLmpTNAICofheY9xUvMKadJ85IAlsn2qyGcDXN3k';

async function compareKeys() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const config = await db.collection('configurations').findOne({});
    
    const dbKey = config.fast2smsApiKey ? String(config.fast2smsApiKey).trim() : null;
    const workingKey = WORKING_API_KEY.trim();
    
    console.log('📋 API Key Comparison:');
    console.log('  Database key length:', dbKey ? dbKey.length : 0);
    console.log('  Working key length:', workingKey.length);
    console.log('');
    
    console.log('🔑 Database Key (full):');
    console.log(dbKey);
    console.log('');
    
    console.log('🔑 Working Key (full):');
    console.log(workingKey);
    console.log('');
    
    if (dbKey === workingKey) {
      console.log('✅ Keys match exactly');
    } else {
      console.log('❌ Keys DO NOT match!');
      console.log('');
      console.log('Differences:');
      
      // Find first difference
      const minLen = Math.min(dbKey.length, workingKey.length);
      for (let i = 0; i < minLen; i++) {
        if (dbKey[i] !== workingKey[i]) {
          console.log(`  Position ${i}: DB='${dbKey[i]}' (${dbKey.charCodeAt(i)}) vs Working='${workingKey[i]}' (${workingKey.charCodeAt(i)})`);
          break;
        }
      }
      
      if (dbKey.length !== workingKey.length) {
        console.log(`  Length difference: DB has ${dbKey.length} chars, Working has ${workingKey.length} chars`);
      }
    }
    
    // Check for hidden characters
    console.log('');
    console.log('🔍 Character Analysis:');
    console.log('  Database key has non-printable:', /[\x00-\x1F\x7F-\x9F]/.test(dbKey));
    console.log('  Working key has non-printable:', /[\x00-\x1F\x7F-\x9F]/.test(workingKey));
    
    // Show character codes for first 10 and last 10
    console.log('');
    console.log('  Database key (first 10 chars codes):', dbKey.substring(0, 10).split('').map(c => c.charCodeAt(0)).join(','));
    console.log('  Working key (first 10 chars codes):', workingKey.substring(0, 10).split('').map(c => c.charCodeAt(0)).join(','));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

compareKeys();

