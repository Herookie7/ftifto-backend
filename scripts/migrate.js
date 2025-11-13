#!/usr/bin/env node
/**
 * USAGE: node scripts/migrate.js [up|down|list]
 * Requires: MONGODB_URI (or equivalent env configured via src/config)
 * Example: node scripts/migrate.js up
 */
const { migrateUp, migrateDown, listMigrations } = require('../src/migrations/runner');
const logger = require('../src/logger');

const [, , command = 'up'] = process.argv;

const run = async () => {
  switch (command) {
    case 'up':
      await migrateUp();
      break;
    case 'down':
      await migrateDown();
      break;
    case 'list':
      await listMigrations();
      break;
    default:
      logger.error(`Unknown migrate command "${command}". Use up, down, or list.`);
      process.exitCode = 1;
  }
};

run()
  .then(() => {
    logger.info('Migration command completed');
    process.exit();
  })
  .catch((error) => {
    logger.error('Migration command failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });


