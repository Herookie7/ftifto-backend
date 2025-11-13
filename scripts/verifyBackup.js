#!/usr/bin/env node
/**
 * USAGE: node scripts/verifyBackup.js [backupKey]
 * Requires: AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or AWS_S3_* variants), AWS_S3_BUCKET (or S3_BUCKET), BACKUP_VERIFY_URI (optional)
 * Example: node scripts/verifyBackup.js backups/backup-2025-01-01T00-00-00-000Z.zip
 */
const mongoose = require('mongoose');
const logger = require('../src/logger');
const config = require('../src/config');
const {
  buildS3Client,
  listBackups,
  downloadBackupStream,
  restoreCollectionsFromZip
} = require('./lib/backupUtils');

const [, , providedKey] = process.argv;

const deriveVerifyUri = () => {
  const explicit = process.env.BACKUP_VERIFY_URI || config.backups?.verifyUri;
  if (explicit) {
    return explicit;
  }

  try {
    const parsed = new URL(config.db.uri);
    const existingDb = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.substring(1) : 'tifto';
    parsed.pathname = `/${existingDb}-verify`;
    return parsed.toString();
  } catch (error) {
    throw new Error('Failed to derive BACKUP_VERIFY_URI from MONGO_URI. Please set BACKUP_VERIFY_URI explicitly or ensure MONGO_URI is valid.');
  }
};

const ensureConfig = () => {
  const bucket = config.backups?.bucket;
  if (!bucket) {
    throw new Error('Missing AWS_S3_BUCKET (or S3_BUCKET) configuration for backup verification');
  }
};

const runSmokeChecks = async (db) => {
  const collectionsToCheck = ['users', 'orders', 'products'];
  const counts = {};

  for (const name of collectionsToCheck) {
    const exists = await db.listCollections({ name }, { nameOnly: true }).toArray();
    if (!exists.length) {
      counts[name] = 0;
      // eslint-disable-next-line no-continue
      continue;
    }
    counts[name] = await db.collection(name).countDocuments();
  }

  return counts;
};

const verifyBackup = async () => {
  ensureConfig();
  const s3Client = buildS3Client(config.backups || {});
  const bucket = config.backups.bucket;

  let backupKey = providedKey;

  if (!backupKey) {
    const backups = await listBackups({ s3Client, bucket, prefix: config.backups.prefix });
    if (!backups.length) {
      throw new Error('No backups found to verify');
    }
    backupKey = backups[0].Key;
    logger.info('No backup key provided, using most recent backup', { backupKey });
  }

  const verifyUri = deriveVerifyUri();
  logger.info('Verifying backup into temporary database', { backupKey, verifyUri });

  await mongoose.connect(verifyUri);

  const verificationReport = {
    backupKey,
    bucket,
    verifyUri,
    restoredCollections: {},
    smokeChecks: {},
    verifiedAt: new Date().toISOString()
  };

  try {
    const zipStream = await downloadBackupStream({ s3Client, bucket, key: backupKey });
    verificationReport.restoredCollections = await restoreCollectionsFromZip({
      zipStream,
      db: mongoose.connection.db,
      logger
    });

    verificationReport.smokeChecks = await runSmokeChecks(mongoose.connection.db);
    logger.info('Backup verification succeeded', verificationReport);

    process.stdout.write(`${JSON.stringify(verificationReport, null, 2)}\n`);
  } finally {
    try {
      await mongoose.connection.db.dropDatabase();
      logger.info('Dropped verification database', { verifyUri });
    } catch (error) {
      logger.warn('Failed to drop verification database', { error: error.message });
    }
    await mongoose.connection.close();
  }
};

verifyBackup()
  .then(() => {
    logger.info('verifyBackup script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Backup verification failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });


