#!/usr/bin/env node
/**
 * USAGE: node scripts/runDataRetention.js [--dry-run]
 * Requires: MONGODB_URI, AWS credentials (for report upload), DATA_RETENTION_DAYS
 * Example: DATA_RETENTION_DAYS=180 node scripts/runDataRetention.js --dry-run
 */
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const logger = require('../src/logger');
const { runDataRetention } = require('../src/services/dataRetention.service');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const run = async () => {
  await connectDatabase();

  const summary = await runDataRetention({ dryRun });

  logger.info('Data retention summary', summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
};

run()
  .then(() => mongoose.connection.close())
  .catch((error) => {
    logger.error('Data retention job failed', { error: error.message });
    mongoose.connection
      .close()
      .catch((closeError) => logger.warn('Failed to close MongoDB connection', { error: closeError.message }))
      .finally(() => process.exit(1));
  });


