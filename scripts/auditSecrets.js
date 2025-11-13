#!/usr/bin/env node
/**
 * USAGE: node scripts/auditSecrets.js [--json] [--output summary.json]
 * Verifies presence and freshness of required secrets/environment variables.
 */
const fs = require('fs');
const path = require('path');
const { loadIntoProcess } = require('../src/config/secretsProvider');
const config = require('../src/config');

const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

const REQUIRED_SECRETS = [
  { key: 'MONGO_URI', label: 'MongoDB URI', critical: true },
  { key: 'JWT_SECRET', label: 'JWT Secret', critical: true },
  { key: 'AWS_ACCESS_KEY_ID', label: 'AWS Access Key', critical: true },
  { key: 'AWS_SECRET_ACCESS_KEY', label: 'AWS Secret Key', critical: true },
  { key: 'AWS_S3_BUCKET', label: 'S3 Bucket', critical: true },
  { key: 'SLACK_WEBHOOK_URL', label: 'Slack Webhook', critical: false },
  { key: 'DISCORD_WEBHOOK_URL', label: 'Discord Webhook', critical: false },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', critical: false },
  { key: 'SENTRY_DSN', label: 'Sentry DSN', critical: false },
  { key: 'REDIS_URL', label: 'Redis URL', critical: true }
];

const ROTATION_TARGETS = [
  { key: 'JWT_SECRET', rotatedKey: 'JWT_SECRET_ROTATED_AT', maxAgeDays: 90 },
  { key: 'AWS_SECRET_ACCESS_KEY', rotatedKey: 'AWS_SECRET_ROTATED_AT', maxAgeDays: 90 },
  { key: 'STRIPE_SECRET_KEY', rotatedKey: 'STRIPE_SECRET_ROTATED_AT', maxAgeDays: 120 }
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    json: false,
    output: null
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--output') {
      options.output = args[i + 1];
      i += 1;
    }
  }

  return options;
};

const colorize = (status, text) => {
  switch (status) {
    case 'PASS':
      return `${COLORS.green}${text}${COLORS.reset}`;
    case 'WARN':
      return `${COLORS.yellow}${text}${COLORS.reset}`;
    default:
      return `${COLORS.red}${text}${COLORS.reset}`;
  }
};

const checkSecretPresence = () =>
  REQUIRED_SECRETS.map((secret) => {
    const present = Boolean(process.env[secret.key]);
    return {
      key: secret.key,
      label: secret.label,
      critical: secret.critical,
      status: present ? 'PASS' : secret.critical ? 'FAIL' : 'WARN',
      message: present ? 'Present' : 'Missing'
    };
  });

const checkRotation = () =>
  ROTATION_TARGETS.map((target) => {
    const value = process.env[target.key];
    if (!value) {
      return {
        key: target.key,
        label: target.key,
        rotatedKey: target.rotatedKey,
        status: 'WARN',
        message: 'Secret not present; skipping rotation check'
      };
    }

    const rotatedValue = process.env[target.rotatedKey];
    if (!rotatedValue) {
      return {
        key: target.key,
        label: target.key,
        rotatedKey: target.rotatedKey,
        status: 'WARN',
        message: `Rotation timestamp missing (${target.rotatedKey})`
      };
    }

    const rotatedAt = new Date(rotatedValue);
    if (Number.isNaN(rotatedAt.getTime())) {
      return {
        key: target.key,
        label: target.key,
        rotatedKey: target.rotatedKey,
        status: 'WARN',
        message: `Invalid rotation timestamp (${rotatedValue})`
      };
    }

    const ageDays = Math.floor((Date.now() - rotatedAt.getTime()) / (24 * 60 * 60 * 1000));
    const withinThreshold = ageDays <= target.maxAgeDays;

    return {
      key: target.key,
      label: target.key,
      rotatedKey: target.rotatedKey,
      status: withinThreshold ? 'PASS' : 'FAIL',
      message: withinThreshold
        ? `Rotated ${ageDays} day(s) ago`
        : `Stale rotation (${ageDays} day(s); max ${target.maxAgeDays})`
    };
  });

const summarize = (presenceResults, rotationResults) => {
  const presenceFailures = presenceResults.filter((item) => item.status === 'FAIL');
  const rotationFailures = rotationResults.filter((item) => item.status === 'FAIL');

  return {
    generatedAt: new Date().toISOString(),
    environment: config.app.nodeEnv,
    summary: {
      totalChecks: presenceResults.length + rotationResults.length,
      failed: presenceFailures.length + rotationFailures.length,
      warnings:
        presenceResults.filter((item) => item.status === 'WARN').length +
        rotationResults.filter((item) => item.status === 'WARN').length
    },
    presence: presenceResults,
    rotation: rotationResults
  };
};

const main = async () => {
  const options = parseArgs();

  await loadIntoProcess();

  const presenceResults = checkSecretPresence();
  const rotationResults = checkRotation();
  const summary = summarize(presenceResults, rotationResults);

  const logSection = (title, results) => {
    console.log(`\n${title}`);
    results.forEach((result) => {
      const line = `  ${result.label || result.key}: ${result.message}`;
      console.log(colorize(result.status, line));
    });
  };

  if (!options.json) {
    console.log('\nSecrets Compliance Summary');
    console.log('===========================');
    console.log(
      colorize(
        summary.summary.failed === 0 ? 'PASS' : 'FAIL',
        `Total Checks: ${summary.summary.totalChecks} | Failures: ${summary.summary.failed} | Warnings: ${summary.summary.warnings}`
      )
    );
    logSection('Presence Checks', presenceResults);
    logSection('Rotation Checks', rotationResults);
    console.log('');
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, JSON.stringify(summary, null, 2), 'utf8');
  }

  if (summary.summary.failed > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('Compliance audit failed:', error);
  process.exit(1);
});


