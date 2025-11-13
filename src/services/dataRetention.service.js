const { PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const config = require('../config');
const logger = require('../logger');
const User = require('../models/User');
const PrivacyRequest = require('../models/PrivacyRequest');
const { buildS3Client } = require('../../scripts/lib/backupUtils');

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const escapeCsv = (value) => {
  if (value === null || typeof value === 'undefined') {
    return '';
  }
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildCsvReport = (rows) => {
  const headers = ['userId', 'emailBefore', 'role', 'anonymizedAt', 'privacyRequestId', 'notes'];
  const dataRows = rows.map((row) =>
    headers
      .map((header) => escapeCsv(row[header]))
      .join(',')
  );
  return [headers.join(','), ...dataRows].join('\n');
};

const uploadReport = async (csvContent, timestamp) => {
  if (!config.backups?.bucket) {
    logger.warn('Skipping retention report upload; AWS_S3_BUCKET not configured');
    return null;
  }

  const client = buildS3Client(config.backups);
  const prefix = config.dataRetention.s3Prefix?.endsWith('/')
    ? config.dataRetention.s3Prefix
    : `${config.dataRetention.s3Prefix}/`;
  const key = path.posix.join(prefix, `data-retention-${timestamp.replace(/[:.]/g, '-')}.csv`);

  await client.send(
    new PutObjectCommand({
      Bucket: config.backups.bucket,
      Key: key,
      Body: csvContent,
      ContentType: 'text/csv'
    })
  );

  logger.info('Uploaded data retention report to S3', { bucket: config.backups.bucket, key });
  return key;
};

const anonymizeUser = (user, now) => {
  const anonymizedName = `Anonymized-${user._id.toString().slice(-6)}`;
  user.name = anonymizedName;
  user.email = undefined;
  user.phone = undefined;
  user.isActive = false;
  user.addressBook = [];
  user.pushTokens = [];
  if (user.preferences) {
    user.preferences.marketingOptIn = false;
  }
  user.metadata = {
    ...(user.metadata || {}),
    anonymizedAt: now.toISOString(),
    anonymizedReason: 'data-retention-policy'
  };
};

const runDataRetention = async ({ dryRun = false, days, referenceDate = new Date() } = {}) => {
  const retentionDays = days || config.dataRetention.days || 365;
  const cutoff = new Date(referenceDate.getTime() - retentionDays * MS_IN_DAY);

  logger.info('Starting data retention pass', {
    retentionDays,
    cutoff: cutoff.toISOString(),
    dryRun
  });

  const candidates = await User.find({
    updatedAt: { $lt: cutoff },
    role: { $ne: 'admin' }
  });

  const auditRows = [];
  let processedCount = 0;

  for (const user of candidates) {
    const originalEmail = user.email;
    if (dryRun) {
      auditRows.push({
        userId: user._id,
        emailBefore: originalEmail,
        role: user.role,
        anonymizedAt: referenceDate.toISOString(),
        privacyRequestId: '',
        notes: 'dry-run'
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    anonymizeUser(user, referenceDate);
    await user.save();
    processedCount += 1;

    const linkedRequest = await PrivacyRequest.findOneAndUpdate(
      {
        status: { $in: ['pending', 'processing'] },
        type: 'deletion',
        $or: [{ user: user._id }, { email: originalEmail }]
      },
      {
        status: 'completed',
        resolvedAt: referenceDate,
        notes: 'Automatically resolved via retention job'
      },
      { new: true }
    );

    auditRows.push({
      userId: user._id,
      emailBefore: originalEmail,
      role: user.role,
      anonymizedAt: referenceDate.toISOString(),
      privacyRequestId: linkedRequest ? linkedRequest.id : '',
      notes: linkedRequest ? 'privacy-request-fulfilled' : 'auto-retention'
    });
  }

  const csvContent = buildCsvReport(auditRows);
  let reportKey = null;

  if (!dryRun && auditRows.length) {
    const timestamp = referenceDate.toISOString();
    reportKey = await uploadReport(csvContent, timestamp);
  }

  logger.info('Data retention pass completed', {
    processedCount,
    dryRun,
    reportKey
  });

  return {
    processedCount,
    scannedCount: candidates.length,
    reportKey,
    dryRun
  };
};

module.exports = {
  runDataRetention
};


