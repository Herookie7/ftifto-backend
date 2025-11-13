#!/usr/bin/env node
/**
 * USAGE: node scripts/disasterRecovery.js [--target-uri mongodb://...] [--dry-run]
 * Requires: AWS credentials, S3 bucket settings, MONGODB_URI fallback, Slack webhook optional.
 */
const path = require('path');
const mongoose = require('mongoose');
const { spawnSync } = require('child_process');
const logger = require('../src/logger');
const config = require('../src/config');
const secretsProvider = require('../src/config/secretsProvider');
const {
  buildS3Client,
  listBackups,
  downloadBackupStream,
  restoreCollectionsFromZip
} = require('./lib/backupUtils');

const fetchFn = (...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    targetUri: process.env.DR_TARGET_URI || config.db.uri,
    dryRun: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--target-uri') {
      options.targetUri = args[i + 1];
      i += 1;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
};

const postToWebhook = async (url, payload) => {
  if (!url) {
    return;
  }
  try {
    await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.warn('Failed to post disaster recovery status to webhook', { error: error.message });
  }
};

const runCommand = (command, args, env) => {
  const result = spawnSync(command, args, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}`);
  }
};

const main = async () => {
  const options = parseArgs();
  await secretsProvider.loadIntoProcess();

  const slackWebhook = process.env.SLACK_WEBHOOK_URL || process.env.SLACK_RELEASE_WEBHOOK || process.env.SLACK_WEBHOOK;
  const bucket = config.backups?.bucket;

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is required for disaster recovery automation');
  }

  const s3Client = buildS3Client(config.backups);
  const backups = await listBackups({
    s3Client,
    bucket,
    prefix: config.backups.prefix
  });

  if (!backups.length) {
    throw new Error('No backups found in the configured S3 bucket');
  }

  const latestBackup = backups[0];
  logger.info('Selected backup for recovery', { key: latestBackup.Key, size: latestBackup.Size });

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          targetUri: options.targetUri,
          backupKey: latestBackup.Key,
          size: latestBackup.Size
        },
        null,
        2
      )
    );
    return;
  }

  await mongoose.connect(options.targetUri);

  const report = {
    backupKey: latestBackup.Key,
    targetUri: options.targetUri,
    startedAt: new Date().toISOString(),
    restoreCounts: {},
    migrateStatus: 'pending',
    verifyStatus: 'pending',
    status: 'in-progress'
  };

  try {
    const stream = await downloadBackupStream({
      s3Client,
      bucket,
      key: latestBackup.Key
    });

    report.restoreCounts = await restoreCollectionsFromZip({
      zipStream: stream,
      db: mongoose.connection.db,
      logger
    });

    await mongoose.connection.close();

    runCommand('npm', ['run', 'migrate:up'], {
      MONGODB_URI: options.targetUri
    });
    report.migrateStatus = 'success';

    runCommand('npm', ['run', 'verify'], {
      MONGODB_URI: options.targetUri
    });
    report.verifyStatus = 'success';
    report.status = 'completed';
    report.completedAt = new Date().toISOString();

    await postToWebhook(slackWebhook, {
      text: `✅ Disaster recovery completed for ${options.targetUri}\nBackup: ${latestBackup.Key}\nCollections restored: ${Object.keys(
        report.restoreCounts
      ).length}`
    });
  } catch (error) {
    logger.error('Disaster recovery failed', { error: error.message, stack: error.stack });
    report.status = 'failed';
    report.error = error.message;
    report.failedAt = new Date().toISOString();
    await postToWebhook(slackWebhook, {
      text: `🚨 Disaster recovery failed for ${options.targetUri}\nBackup: ${latestBackup.Key}\nError: ${error.message}`
    });
    throw error;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {});
    }
    console.log(JSON.stringify(report, null, 2));
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


