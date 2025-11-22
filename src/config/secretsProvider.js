const logger = require('../logger');
const config = require('./index');
const fetchFn = (...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args));

let initialized = false;

const applySecretPayload = (payload = {}) => {
  Object.entries(payload).forEach(([key, value]) => {
    if (typeof key !== 'string' || !key.length) {
      return;
    }

    if (process.env[key]) {
      logger.debug(`Skipping secret ${key} because environment variable is already set`);
      return;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    process.env[key] = stringValue;
    logger.info(`Loaded secret ${key} from external provider`);
  });
};

const loadFromAws = async () => {
  const { aws } = config.secrets;
  if (!aws.secretIds.length) {
    logger.warn('AWS Secrets Manager selected but AWS_SECRETS_IDS is empty');
    return;
  }

  let SecretsManagerClient;
  let GetSecretValueCommand;
  try {
    ({ SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager'));
  } catch (error) {
    throw new Error('Missing dependency @aws-sdk/client-secrets-manager. Install it to enable AWS secrets loading.');
  }

  const client = new SecretsManagerClient({
    region: aws.region
  });

  for (const secretId of aws.secretIds) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
      let payload = {};
      if (response.SecretString) {
        try {
          payload = JSON.parse(response.SecretString);
        } catch (parseError) {
          logger.warn('Secret string is not JSON, storing raw value', {
            secretId
          });
          payload = { [secretId]: response.SecretString };
        }
      }
      applySecretPayload(payload);
    } catch (error) {
      logger.error('Failed to load secret from AWS Secrets Manager', {
        secretId,
        error: error.message
      });
      throw error;
    }
  }
};

const loadFromVault = async () => {
  const { vault } = config.secrets;
  if (!vault.address || !vault.token) {
    logger.warn('Vault selected but VAULT_ADDR or VAULT_TOKEN is missing');
    return;
  }
  if (!vault.paths.length) {
    logger.warn('Vault selected but VAULT_SECRETS_PATHS is empty');
    return;
  }

  const headers = {
    'X-Vault-Token': vault.token,
    'Content-Type': 'application/json'
  };

  for (const path of vault.paths) {
    const url = `${vault.address.replace(/\/$/, '')}/v1/${path.replace(/^\//, '')}`;
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetchFn(url, { method: 'GET', headers });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Status ${response.status}: ${body}`);
      }
      // eslint-disable-next-line no-await-in-loop
      const data = await response.json();
      const payload = data?.data?.data || data?.data || {};
      applySecretPayload(payload);
    } catch (error) {
      logger.error('Failed to load secret from Vault', {
        path,
        error: error.message
      });
      throw error;
    }
  }
};

const loadIntoProcess = async () => {
  if (!config.secrets.useSecretsManager) {
    logger.debug('USE_SECRETS_MANAGER is disabled; skipping external secret loading');
    return;
  }

  if (initialized) {
    return;
  }

  logger.info('Attempting to load secrets from external provider', {
    provider: config.secrets.provider
  });

  switch (config.secrets.provider) {
    case 'aws':
      await loadFromAws();
      break;
    case 'vault':
      await loadFromVault();
      break;
    default:
      logger.warn('Unknown secrets provider specified; skipping', {
        provider: config.secrets.provider
      });
  }

  initialized = true;
};

module.exports = {
  loadIntoProcess
};


