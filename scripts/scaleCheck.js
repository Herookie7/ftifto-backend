#!/usr/bin/env node
/**
 * USAGE: node scripts/scaleCheck.js [--json]
 * Requires: RENDER_API_TOKEN & RENDER_SERVICE_IDS (comma separated) for Render checks.
 *           AWS credentials plus AWS_EC2_INSTANCE_IDS/AWS_RDS_INSTANCE_IDENTIFIERS (comma separated) for AWS checks.
 */
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const path = require('path');
const { loadIntoProcess } = require('../src/config/secretsProvider');
const config = require('../src/config');
const logger = require('../src/logger');

const fetchFn = (...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args));

const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    json: args.includes('--json')
  };
};

const colorize = (status, text) => {
  if (status === 'WARN') {
    return `${COLORS.yellow}${text}${COLORS.reset}`;
  }
  if (status === 'ALERT') {
    return `${COLORS.red}${text}${COLORS.reset}`;
  }
  return `${COLORS.green}${text}${COLORS.reset}`;
};

const fetchRenderService = async (serviceId, token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const baseUrl = `https://api.render.com/v1/services/${serviceId}`;
  const [serviceResponse, cpuResponse, memoryResponse] = await Promise.all([
    fetchFn(baseUrl, { headers }),
    fetchFn(`${baseUrl}/metrics?metric=cpu&resolution=5m&limit=12`, { headers }).catch(() => null),
    fetchFn(`${baseUrl}/metrics?metric=memory&resolution=5m&limit=12`, { headers }).catch(() => null)
  ]);

  if (!serviceResponse.ok) {
    const body = await serviceResponse.text();
    throw new Error(`Failed to fetch Render service ${serviceId}: ${serviceResponse.status} ${body}`);
  }

  const serviceJson = await serviceResponse.json();
  const cpuValue = cpuResponse?.ok ? await cpuResponse.json() : null;
  const memoryValue = memoryResponse?.ok ? await memoryResponse.json() : null;

  const extractLatest = (metricPayload) => {
    if (!metricPayload?.metrics?.length) {
      return null;
    }
    const sorted = metricPayload.metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sorted[0]?.value ?? null;
  };

  return {
    id: serviceId,
    name: serviceJson.name,
    type: serviceJson.type,
    region: serviceJson.region?.name || serviceJson.region,
    plan: serviceJson.servicePlan,
    cpuUtilization: extractLatest(cpuValue),
    memoryUtilization: extractLatest(memoryValue)
  };
};

const fetchAwsMetrics = async (client, namespace, metricName, dimensionName, dimensionValue) => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

  const command = new GetMetricStatisticsCommand({
    Namespace: namespace,
    MetricName: metricName,
    Dimensions: [
      {
        Name: dimensionName,
        Value: dimensionValue
      }
    ],
    StartTime: startTime,
    EndTime: endTime,
    Period: 300,
    Statistics: ['Average']
  });

  const response = await client.send(command);
  if (!response.Datapoints || response.Datapoints.length === 0) {
    return null;
  }
  const latest = response.Datapoints.sort((a, b) => b.Timestamp - a.Timestamp)[0];
  return latest.Average;
};

const evaluateThreshold = (value, threshold = 80) => {
  if (value === null || typeof value === 'undefined') {
    return 'INFO';
  }
  return value >= threshold ? 'ALERT' : value >= threshold * 0.8 ? 'WARN' : 'PASS';
};

const main = async () => {
  const options = parseArgs();
  await loadIntoProcess();

  const results = {
    render: [],
    aws: [],
    summary: {
      alerts: 0,
      warnings: 0
    }
  };

  const renderToken = process.env.RENDER_API_TOKEN;
  const renderServiceIds = (process.env.RENDER_SERVICE_IDS || process.env.RENDER_SERVICE_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (renderToken && renderServiceIds.length) {
    for (const serviceId of renderServiceIds) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const service = await fetchRenderService(serviceId, renderToken);
        const cpuStatus = evaluateThreshold(service.cpuUtilization);
        const memoryStatus = evaluateThreshold(service.memoryUtilization);
        if (cpuStatus === 'ALERT' || memoryStatus === 'ALERT') {
          results.summary.alerts += 1;
        } else if (cpuStatus === 'WARN' || memoryStatus === 'WARN') {
          results.summary.warnings += 1;
        }
        results.render.push({
          provider: 'Render',
          ...service,
          cpuStatus,
          memoryStatus
        });
      } catch (error) {
        logger.error(`Render scale check failed for ${serviceId}`, { error: error.message });
        results.render.push({
          provider: 'Render',
          id: serviceId,
          error: error.message
        });
      }
    }
  }

  const awsRegion = process.env.AWS_REGION || process.env.AWS_S3_REGION || config.backups?.region;
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const ec2Instances = (process.env.AWS_EC2_INSTANCE_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const rdsInstances = (process.env.AWS_RDS_INSTANCE_IDENTIFIERS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (awsRegion && awsAccessKey && awsSecretKey && (ec2Instances.length || rdsInstances.length)) {
    const cwClient = new CloudWatchClient({ region: awsRegion });

    for (const instanceId of ec2Instances) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const cpuAverage = await fetchAwsMetrics(cwClient, 'AWS/EC2', 'CPUUtilization', 'InstanceId', instanceId);
        const status = evaluateThreshold(cpuAverage);
        if (status === 'ALERT') {
          results.summary.alerts += 1;
        } else if (status === 'WARN') {
          results.summary.warnings += 1;
        }
        results.aws.push({
          provider: 'AWS',
          service: 'EC2',
          identifier: instanceId,
          region: awsRegion,
          cpuUtilization: cpuAverage,
          cpuStatus: status
        });
      } catch (error) {
        logger.error(`AWS EC2 scale check failed for ${instanceId}`, { error: error.message });
        results.aws.push({
          provider: 'AWS',
          service: 'EC2',
          identifier: instanceId,
          region: awsRegion,
          error: error.message
        });
      }
    }

    for (const dbIdentifier of rdsInstances) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const cpuAverage = await fetchAwsMetrics(cwClient, 'AWS/RDS', 'CPUUtilization', 'DBInstanceIdentifier', dbIdentifier);
        const status = evaluateThreshold(cpuAverage);
        if (status === 'ALERT') {
          results.summary.alerts += 1;
        } else if (status === 'WARN') {
          results.summary.warnings += 1;
        }
        results.aws.push({
          provider: 'AWS',
          service: 'RDS',
          identifier: dbIdentifier,
          region: awsRegion,
          cpuUtilization: cpuAverage,
          cpuStatus: status
        });
      } catch (error) {
        logger.error(`AWS RDS scale check failed for ${dbIdentifier}`, { error: error.message });
        results.aws.push({
          provider: 'AWS',
          service: 'RDS',
          identifier: dbIdentifier,
          region: awsRegion,
          error: error.message
        });
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log('\nScaling & Cost Optimization Report');
  console.log('=================================');
  console.log(
    colorize(
      results.summary.alerts > 0 ? 'ALERT' : results.summary.warnings > 0 ? 'WARN' : 'PASS',
      `Alerts: ${results.summary.alerts} | Warnings: ${results.summary.warnings}`
    )
  );

  if (results.render.length) {
    console.log('\nRender Services');
    results.render.forEach((service) => {
      if (service.error) {
        console.log(colorize('WARN', `  ${service.id}: ${service.error}`));
        return;
      }
      console.log(
        colorize(
          service.cpuStatus === 'ALERT' || service.memoryStatus === 'ALERT'
            ? 'ALERT'
            : service.cpuStatus === 'WARN' || service.memoryStatus === 'WARN'
              ? 'WARN'
              : 'PASS',
          `  ${service.name} (${service.id}) - ${service.plan} @ ${service.region} | CPU: ${service.cpuUtilization ?? 'n/a'}% | Memory: ${service.memoryUtilization ?? 'n/a'}%`
        )
      );
    });
  }

  if (results.aws.length) {
    console.log('\nAWS Resources');
    results.aws.forEach((resource) => {
      if (resource.error) {
        console.log(colorize('WARN', `  ${resource.service} ${resource.identifier}: ${resource.error}`));
        return;
      }
      console.log(
        colorize(
          resource.cpuStatus === 'ALERT' ? 'ALERT' : resource.cpuStatus === 'WARN' ? 'WARN' : 'PASS',
          `  ${resource.service} ${resource.identifier} (${resource.region}) - CPU: ${resource.cpuUtilization ?? 'n/a'}%`
        )
      );
    });
  }

  console.log('');
};

main().catch((error) => {
  logger.error('Scale check failed', { error: error.message });
  console.error(error);
  process.exit(1);
});


