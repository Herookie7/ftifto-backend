#!/usr/bin/env node
/**
 * USAGE: node scripts/rollupAuditLogs.js [--days 1]
 * Compresses local audit logs and uploads them to S3.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { buildS3Client } = require('./lib/backupUtils');
const auditLogger = require('../src/services/auditLogger');
const config = require('../src/config');
const logger = require('../src/logger');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    days: 1
  };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--days') {
      options.days = Number(args[i + 1]) || 1;
      i += 1;
    }
  }

  return options;
};

const compressFile = async (filePath) => {
  const content = await fs.promises.readFile(filePath);
  return zlib.gzipSync(content);
};

const main = async () => {
  const options = parseArgs();
  const auditDir = auditLogger.getAuditDirectory();

  if (!config.backups?.bucket) {
    logger.warn('Skipping audit log roll-up; AWS_S3_BUCKET not configured');
    return;
  }

  let files;
  try {
    files = await fs.promises.readdir(auditDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.info('No audit logs directory found, skipping roll-up.');
      return;
    }
    throw error;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - options.days);

  const targetFiles = files
    .filter((file) => file.endsWith('.jsonl'))
    .filter((file) => {
      const datePart = file.replace('.jsonl', '');
      const fileDate = new Date(datePart);
      return fileDate <= cutoff;
    });

  if (!targetFiles.length) {
    logger.info('No audit logs eligible for compression');
    return;
  }

  const s3Client = buildS3Client(config.backups);
  const uploaded = [];

  for (const file of targetFiles) {
    const filePath = path.join(auditDir, file);
    const compressed = await compressFile(filePath);
    const key = path.posix.join('logs/audit', `${file}.gz`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.backups.bucket,
        Key: key,
        Body: compressed,
        ContentType: 'application/gzip'
      })
    );

    await fs.promises.unlink(filePath);
    uploaded.push(key);
  }

  console.log(
    JSON.stringify(
      {
        uploaded,
        bucket: config.backups.bucket,
        removed: targetFiles.length
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  logger.error('Audit log roll-up failed', { error: error.message });
  console.error(error);
  process.exit(1);
});


