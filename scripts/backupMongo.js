#!/usr/bin/env node
/**
 * USAGE: node scripts/backupMongo.js [--prefix backups/] [--tag nightly]
 * Requires: MONGO_URI, AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or AWS_S3_* variants), AWS_S3_BUCKET (or S3_BUCKET)
 * Example: node scripts/backupMongo.js --prefix nightly/
 */
const mongoose = require('mongoose');
const logger = require('../src/logger');
const config = require('../src/config');
const {
  buildS3Client,
  createBackupArchive,
  uploadBackup,
  generateBackupKey,
  enforceRetention
} = require('./lib/backupUtils');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      if (value !== true) {
        i += 1;
      }
      parsed[key] = value;
    }
  }

  return parsed;
};

const ensureConfig = () => {
  const bucket = config.backups?.bucket;
  if (!bucket) {
    throw new Error('Missing AWS_S3_BUCKET (or S3_BUCKET) configuration for backups');
  }
};

const runBackup = async () => {
  ensureConfig();
  const args = parseArgs();
  const timestamp = new Date().toISOString();
  const prefix = args.prefix || config.backups?.prefix;
  const backupKey = generateBackupKey({ prefix, timestamp });
  const s3Client = buildS3Client(config.backups || {});

  logger.info('Starting MongoDB backup', { key: backupKey });

  await mongoose.connect(config.db.uri);

  try {
    const { archive, stream, finalizePromise } = await createBackupArchive({
      db: mongoose.connection.db,
      logger
    });

    archive.on('warning', (err) => {
      logger.warn('Archive warning during backup', { error: err.message });
    });

    archive.on('error', (err) => {
      throw err;
    });

    const uploadPromise = uploadBackup({
      s3Client,
      bucket: config.backups.bucket,
      key: backupKey,
      bodyStream: stream,
      logger
    });

    await Promise.all([finalizePromise, uploadPromise]);

    const retentionResult = await enforceRetention({
      s3Client,
      bucket: config.backups.bucket,
      prefix: prefix || config.backups.prefix,
      retention: config.backups.retention,
      logger
    });

    const report = {
      backupKey,
      bucket: config.backups.bucket,
      prefix: prefix || config.backups.prefix,
      retention: config.backups.retention,
      retentionResult,
      generatedAt: timestamp
    };

    logger.info('Backup completed successfully', report);
    // Output JSON for automation consumers
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await mongoose.connection.close();
  }
};

runBackup()
  .then(() => {
    logger.info('backupMongo script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('MongoDB backup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });


