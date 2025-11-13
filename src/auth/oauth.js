const querystring = require('node:querystring');
const config = require('../config');
const logger = require('../logger');

const fetchFn = (...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args));

const PROVIDER_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: () => config.oauth.providers.google.scope
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: () => config.oauth.providers.github.scope
  }
};

const getProvider = (provider) => {
  const normalized = provider.toLowerCase();
  if (!PROVIDER_CONFIG[normalized]) {
    throw new Error(`Unsupported OAuth provider "${provider}"`);
  }

  const providerConfig = config.oauth.providers[normalized];
  if (!providerConfig?.clientId || !providerConfig?.clientSecret) {
    throw new Error(`OAuth provider "${provider}" is not configured. Set client id/secret environment variables.`);
  }

  return {
    ...PROVIDER_CONFIG[normalized],
    clientId: providerConfig.clientId,
    clientSecret: providerConfig.clientSecret
  };
};

const buildAuthorizationUrl = (provider, { state, redirectUri = config.oauth.redirectUri, scope } = {}) => {
  const providerConfig = getProvider(provider);
  const params = {
    client_id: providerConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope || (typeof providerConfig.scope === 'function' ? providerConfig.scope() : providerConfig.scope),
    state
  };

  if (provider === 'google') {
    params.access_type = 'offline';
    params.prompt = 'consent';
  }

  const query = querystring.stringify(Object.fromEntries(Object.entries(params).filter(([, value]) => Boolean(value))));
  return `${providerConfig.authUrl}?${query}`;
};

const exchangeCodeForToken = async (
  provider,
  { code, redirectUri = config.oauth.redirectUri, codeVerifier }
) => {
  const providerConfig = getProvider(provider);
  const body = {
    client_id: providerConfig.clientId,
    client_secret: providerConfig.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  };

  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json'
  };

  const response = await fetchFn(providerConfig.tokenUrl, {
    method: 'POST',
    headers,
    body: querystring.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('OAuth token exchange failed', {
      provider,
      status: response.status,
      error: errorText
    });
    throw new Error(`OAuth token exchange failed: ${response.status}`);
  }

  return response.json();
};

const fetchUserProfile = async (provider, accessToken) => {
  const providerConfig = getProvider(provider);
  const response = await fetchFn(providerConfig.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'ftifto-backend-oauth'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('OAuth user info request failed', {
      provider,
      status: response.status,
      error: errorText
    });
    throw new Error(`OAuth user info request failed: ${response.status}`);
  }

  const profile = await response.json();

  if (provider === 'github' && !profile.email) {
    const emailResponse = await fetchFn('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ftifto-backend-oauth'
      }
    });
    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primary = emails.find((email) => email.primary) || emails[0];
      if (primary?.email) {
        profile.email = primary.email;
      }
    }
  }

  return profile;
};

const createCallbackHandler =
  (provider, { onSuccess, onError, redirectUri = config.oauth.redirectUri } = {}) =>
  async (req, res, next) => {
    try {
      const { code, state } = req.query;
      if (!code) {
        throw new Error('Missing authorization code');
      }

      const tokenResponse = await exchangeCodeForToken(provider, { code, redirectUri });
      const profile = await fetchUserProfile(provider, tokenResponse.access_token);

      if (typeof onSuccess === 'function') {
        return onSuccess({ req, res, state, profile, tokens: tokenResponse });
      }

      return res.json({ profile, tokens: tokenResponse });
    } catch (error) {
      logger.error('OAuth callback failed', { provider, error: error.message });
      if (typeof onError === 'function') {
        return onError(error, req, res, next);
      }
      return next(error);
    }
  };

module.exports = {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  fetchUserProfile,
  createCallbackHandler
};


