const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const PrivacyRequest = require('../models/PrivacyRequest');
const User = require('../models/User');
const Order = require('../models/Order');
const logger = require('../logger');
const config = require('../config');
const auditLogger = require('../services/auditLogger');
const { buildS3Client } = require('../../scripts/lib/backupUtils');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const EXPORT_PREFIX = process.env.PRIVACY_EXPORT_PREFIX || 'privacy-exports/';
const EXPORT_TTL_SECONDS = Number(process.env.PRIVACY_EXPORT_TTL_SECONDS) || 3600;

const ensureS3Available = () => {
  if (!config.backups?.bucket) {
    const error = new Error('S3 bucket not configured for privacy exports');
    error.statusCode = 503;
    error.status = 503;
    throw error;
  }
};

const generateSignedUrl = async (client, key, expiresIn = EXPORT_TTL_SECONDS) => {
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.backups.bucket,
      Key: key
    }),
    { expiresIn }
  );
};

const buildExportPayload = async (email) => {
  const user = await User.findOne({ email }).lean();

  if (!user) {
    return null;
  }

  const orders = await Order.find({ customer: user._id }).lean();

  const sanitizedUser = {
    ...user,
    password: undefined
  };

  return {
    user: sanitizedUser,
    orders
  };
};

const createS3Export = async (client, email) => {
  const payload = await buildExportPayload(email);

  if (!payload) {
    return null;
  }

  const safeId = payload.user?._id?.toString() || email.replace(/[^a-z0-9]/gi, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `${EXPORT_PREFIX}${safeId}/export-${timestamp}.json`;
  const body = JSON.stringify(payload, null, 2);

  const sizeBytes = Buffer.byteLength(body, 'utf8');

  await client.send(
    new PutObjectCommand({
      Bucket: config.backups.bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json'
    })
  );

  const expiresAt = new Date(Date.now() + EXPORT_TTL_SECONDS * 1000);
  const url = await generateSignedUrl(client, key);

  return { key, url, expiresAt, sizeBytes };
};

const requestDeletion = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const payload = {
    type: 'deletion',
    reason: req.body.reason,
    metadata: {
      userAgent: req.headers['user-agent']
    }
  };

  if (req.user) {
    payload.user = req.user._id;
    payload.email = req.user.email;
  } else {
    payload.email = req.body.email?.toLowerCase();
  }

  if (!payload.user && !payload.email) {
    return res.status(400).json({ message: 'Email is required for privacy requests.' });
  }

  const existing = await PrivacyRequest.findOne({
    type: 'deletion',
    status: { $in: ['pending', 'processing'] },
    $or: [
      { user: payload.user || undefined },
      payload.email ? { email: payload.email } : null
    ].filter(Boolean)
  });

  if (existing) {
    logger.info('Existing privacy request found, returning reference', { requestId: existing.id });
    return res.status(200).json({
      requestId: existing.id,
      status: existing.status,
      message: 'A deletion request is already in progress.'
    });
  }

  const request = await PrivacyRequest.create(payload);

  logger.info('Privacy deletion request recorded', {
    requestId: request.id,
    user: request.user,
    email: request.email
  });

  auditLogger.logEvent({
    category: 'privacy',
    action: 'deletion_requested',
    userId: request.user ? request.user.toString() : undefined,
    entityId: request.id,
    entityType: 'privacy_request',
    metadata: {
      email: request.email,
      reason: request.reason
    }
  });

  return res.status(201).json({
    requestId: request.id,
    status: request.status,
    message: 'Your deletion request has been received.'
  });
});

const requestDataPortability = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  ensureS3Available();

  const email = (req.user?.email || req.body.email || '').toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Email is required for data portability.' });
  }

  const client = buildS3Client(config.backups);
  const exportResult = await createS3Export(client, email);

  if (!exportResult) {
    return res.status(404).json({ message: 'No data found for the requested user.' });
  }

  const request = await PrivacyRequest.create({
    type: 'data_portability',
    email,
    user: req.user?._id,
    status: 'completed',
    exportObjectKey: exportResult.key,
    exportUrl: exportResult.url,
    exportExpiresAt: exportResult.expiresAt,
    metadata: {
      userAgent: req.headers['user-agent'],
      exportSizeBytes: exportResult.sizeBytes
    }
  });

  auditLogger.logEvent({
    category: 'privacy',
    action: 'portability_generated',
    userId: req.user?._id ? req.user._id.toString() : undefined,
    entityId: request.id,
    entityType: 'privacy_request',
    metadata: {
      email,
      exportKey: exportResult.key,
      expiresAt: exportResult.expiresAt,
      sizeBytes: exportResult.sizeBytes
    }
  });

  return res.status(201).json({
    requestId: request.id,
    status: request.status,
    downloadUrl: exportResult.url,
    expiresAt: exportResult.expiresAt
  });
});

const getRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await PrivacyRequest.findById(requestId);

  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }

  let downloadUrl = request.exportUrl;
  let expiresAt = request.exportExpiresAt;

  if (request.type === 'data_portability' && request.exportObjectKey) {
    ensureS3Available();
    const now = new Date();
    if (!request.exportExpiresAt || request.exportExpiresAt < now) {
      const client = buildS3Client(config.backups);
      downloadUrl = await generateSignedUrl(client, request.exportObjectKey);
      expiresAt = new Date(Date.now() + EXPORT_TTL_SECONDS * 1000);

      request.exportUrl = downloadUrl;
      request.exportExpiresAt = expiresAt;
      await request.save();
    }
  }

  return res.json({
    requestId: request.id,
    status: request.status,
    requestedAt: request.requestedAt,
    resolvedAt: request.resolvedAt,
    notes: request.notes,
    downloadUrl: downloadUrl ?? undefined,
    expiresAt: expiresAt ?? undefined
  });
});

module.exports = {
  requestDeletion,
  requestDataPortability,
  getRequestStatus
};


