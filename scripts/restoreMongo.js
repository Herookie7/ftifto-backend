#!/usr/bin/env node
/**
 * USAGE: node scripts/restoreMongo.js <backupKey> [mongodbUri]
 * Requires: AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or AWS_S3_* variants), AWS_S3_BUCKET (or S3_BUCKET)
 * Example: node scripts/restoreMongo.js backups/backup-2025-01-01T00-00-00-000Z.zip mongodb://localhost:27017/tifto_restore
 */
const mongoose = require('mongoose');
const logger = require('../src/logger');
const config = require('../src/config');
const { buildS3Client, restoreCollectionsFromZip, downloadBackupStream } = require('./lib/backupUtils');

const [, , backupKey, targetUriArg] = process.argv;

if (!backupKey) {
  logger.error('Backup key must be provided. Example: node scripts/restoreMongo.js backups/latest.zip');
  process.exit(1);
}

const targetUri = targetUriArg || process.env.TARGET_MONGO_URI || config.db.uri;

const ensureConfig = () => {
  const bucket = config.backups?.bucket;
  if (!bucket) {
    throw new Error('Missing AWS_S3_BUCKET (or S3_BUCKET) configuration for restore');
  }
};

const restoreBackup = async () => {
  ensureConfig();
  const s3Client = buildS3Client(config.backups || {});
  const bucket = config.backups.bucket;

  logger.info('Restoring MongoDB backup', { bucket, backupKey, targetUri });

  await mongoose.connect(targetUri);

  try {
    const zipStream = await downloadBackupStream({ s3Client, bucket, key: backupKey });
    const results = await restoreCollectionsFromZip({
      zipStream,
      db: mongoose.connection.db,
      logger
    });

    logger.info('Restore completed', { results });
    process.stdout.write(`${JSON.stringify({ backupKey, bucket, restoredCollections: results }, null, 2)}\n`);
  } finally {
    await mongoose.connection.close();
  }
};

restoreBackup()
  .then(() => {
    logger.info('restoreMongo script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('MongoDB restore failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });


