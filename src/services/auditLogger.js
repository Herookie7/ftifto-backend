const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const logger = require('../logger');

const AUDIT_ROOT = path.resolve(__dirname, '..', '..', 'logs', 'audit');

const ensureDirectory = () => {
  try {
    fs.mkdirSync(AUDIT_ROOT, { recursive: true });
  } catch (error) {
    logger.error('Failed to initialize audit log directory', { error: error.message });
  }
};

ensureDirectory();

const redact = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.length <= 8) {
    return '***redacted***';
  }
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

const sanitizeEvent = (event = {}) => {
  const payload = { ...event };

  if (payload.metadata) {
    payload.metadata = Object.entries(payload.metadata).reduce((acc, [key, value]) => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        acc[key] = redact(String(value));
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  return payload;
};

const writeEvent = async (filePath, event) => {
  const line = `${JSON.stringify(event)}\n`;
  await fs.promises.appendFile(filePath, line, { encoding: 'utf8' });
};

const logEvent = async ({
  category,
  action,
  userId,
  entityId,
  entityType,
  metadata,
  severity = 'info'
} = {}) => {
  const timestamp = new Date();
  const entry = sanitizeEvent({
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    category,
    action,
    userId,
    entityId,
    entityType,
    severity,
    metadata,
    host: os.hostname(),
    pid: process.pid
  });

  const fileName = `${timestamp.toISOString().slice(0, 10)}.jsonl`;
  const filePath = path.join(AUDIT_ROOT, fileName);

  try {
    await writeEvent(filePath, entry);
  } catch (error) {
    logger.error('Failed to write audit event', {
      error: error.message,
      filePath,
      category,
      action
    });
  }
};

module.exports = {
  logEvent,
  getAuditDirectory: () => AUDIT_ROOT
};


