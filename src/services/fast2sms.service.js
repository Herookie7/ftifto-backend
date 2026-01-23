// Fix for node-fetch v3 in CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Configuration = require('../models/Configuration');
const logger = require('../logger');
const auditLogger = require('../services/auditLogger');

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Get Fast2SMS configuration from database
 * @returns {Promise<Object>} Configuration object
 */
const getFast2SMSConfig = async () => {
  const configDoc = await Configuration.getConfiguration();
  return {
    apiKey: configDoc.fast2smsApiKey,
    enabled: configDoc.fast2smsEnabled || false,
    route: configDoc.fast2smsRoute || 'q' // q = quick, d = promotional, t = transactional
  };
};

/**
 * Check if Fast2SMS is configured and enabled
 * @returns {Promise<Boolean>}
 */
const isConfigured = async () => {
  const config = await getFast2SMSConfig();
  return Boolean(config.enabled && config.apiKey);
};

/**
 * Send SMS via Fast2SMS
 * @param {String|Array<String>} numbers - Phone number(s) (10 digits, can be string or array)
 * @param {String} message - Message to send
 * @param {Object} options - Additional options (route, language, flash)
 * @returns {Promise<Object>} API response
 */
const sendSMS = async (numbers, message, options = {}) => {
  const config = await getFast2SMSConfig();

  if (!config.enabled) {
    logger.warn('Fast2SMS is disabled, SMS not sent', { numbers });
    return { success: false, message: 'Fast2SMS is disabled' };
  }

  if (!config.apiKey) {
    logger.error('Fast2SMS API key is not configured');
    throw new Error('Fast2SMS API key is not configured');
  }

  // Normalize phone numbers
  // Fast2SMS requires 10-digit Indian phone numbers (without country code)
  // Remove all non-digits, then take last 10 digits
  let phoneNumbers;
  if (Array.isArray(numbers)) {
    phoneNumbers = numbers.map(num => {
      const cleaned = String(num).replace(/\D/g, '');
      // If number starts with 91 (India country code), remove it
      const normalized = cleaned.startsWith('91') && cleaned.length === 12 
        ? cleaned.slice(2) 
        : cleaned.slice(-10);
      if (normalized.length !== 10) {
        throw new Error(`Invalid phone number format: ${num}. Expected 10 digits.`);
      }
      return normalized;
    }).join(',');
  } else {
    const cleaned = String(numbers).replace(/\D/g, '');
    // If number starts with 91 (India country code), remove it
    const normalized = cleaned.startsWith('91') && cleaned.length === 12 
      ? cleaned.slice(2) 
      : cleaned.slice(-10);
    if (normalized.length !== 10) {
      throw new Error(`Invalid phone number format: ${numbers}. Expected 10 digits.`);
    }
    phoneNumbers = normalized;
  }

  if (!phoneNumbers) {
    throw new Error('Invalid phone number(s)');
  }

  // Prepare request payload
  const payload = {
    route: options.route || config.route || 'q',
    message: message,
    language: options.language || 'english',
    flash: options.flash || 0, // 0 = normal SMS, 1 = flash SMS
    numbers: phoneNumbers
  };

  try {
    logger.info('Sending SMS via Fast2SMS', {
      numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*'),
      route: payload.route,
      messageLength: message.length
    });

    const response = await fetch(FAST2SMS_API_URL, {
      method: 'POST',
      headers: {
        'authorization': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Get response text first to handle non-JSON responses
    const responseText = await response.text();
    
    // Log raw response for debugging (truncated for security)
    logger.info('Fast2SMS API response received', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200) // First 200 chars for debugging
    });

    // Check if response is empty
    if (!responseText || responseText.trim() === '') {
      logger.error('Fast2SMS API returned empty response', {
        status: response.status,
        statusText: response.statusText,
        numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*')
      });
      throw new Error('Fast2SMS API returned empty response. Please check API key and account status.');
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      logger.error('Fast2SMS API returned invalid JSON', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500), // First 500 chars for debugging
        jsonError: jsonError.message,
        numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*')
      });
      throw new Error(`Fast2SMS API returned invalid response. Status: ${response.status}. Please check API key and account status.`);
    }

    if (!response.ok) {
      logger.error('Fast2SMS API error', {
        status: response.status,
        statusText: response.statusText,
        data,
        responseText: responseText.substring(0, 500)
      });
      throw new Error(data.message || `Fast2SMS API request failed (Status: ${response.status})`);
    }

    // Fast2SMS returns success status in return field
    if (data.return === true || data.return === 'true') {
      logger.info('Fast2SMS sent successfully', {
        numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*'),
        requestId: data.request_id
      });

      auditLogger.logEvent({
        category: 'sms',
        action: 'fast2sms_sent',
        entityId: data.request_id,
        entityType: 'sms',
        metadata: {
          numbers: phoneNumbers,
          messageLength: message.length,
          route: payload.route
        }
      });

      return {
        success: true,
        requestId: data.request_id,
        message: 'SMS sent successfully'
      };
    } else {
      logger.error('Fast2SMS returned error', {
        numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*'),
        error: data.message || 'Unknown error',
        fullResponse: data
      });

      auditLogger.logEvent({
        category: 'sms',
        action: 'fast2sms_failed',
        severity: 'warn',
        entityType: 'sms',
        metadata: {
          numbers: phoneNumbers,
          error: data.message
        }
      });

      return {
        success: false,
        message: data.message || 'SMS sending failed'
      };
    }
  } catch (error) {
    // Check if it's a JSON parsing error
    if (error.message && error.message.includes('JSON')) {
      logger.error('Fast2SMS JSON parsing error', {
        error: error.message,
        numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*'),
        stack: error.stack
      });
      throw new Error('Fast2SMS API returned invalid response. Please check API key, account balance, and account status.');
    }

    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      logger.error('Fast2SMS network error', {
        error: error.message,
        numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*')
      });
      throw new Error('Failed to connect to Fast2SMS API. Please check network connection and API endpoint.');
    }

    logger.error('Fast2SMS service error', {
      error: error.message,
      errorName: error.name,
      numbers: phoneNumbers.replace(/\d(?=\d{4})/g, '*'),
      stack: error.stack
    });

    auditLogger.logEvent({
      category: 'sms',
      action: 'fast2sms_error',
      severity: 'error',
      entityType: 'sms',
      metadata: {
        numbers: phoneNumbers,
        error: error.message,
        errorName: error.name
      }
    });

    // Re-throw with user-friendly message if it's our custom error
    if (error.message && !error.message.includes('Fast2SMS')) {
      throw new Error(`Fast2SMS error: ${error.message}`);
    }
    
    throw error;
  }
};

/**
 * Send OTP via Fast2SMS
 * @param {String} phoneNumber - Phone number (10 digits)
 * @param {String} otp - OTP code
 * @param {String} template - Optional template message (if not provided, uses default)
 * @returns {Promise<Object>} API response
 */
const sendOTP = async (phoneNumber, otp, template = null) => {
  const defaultMessage = `Your OTP is ${otp}. Please do not share this OTP with anyone.`;
  const message = template || defaultMessage;

  logger.info('Sending OTP via Fast2SMS', {
    phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
    otpLength: otp.length
  });

  try {
    // Get configured route from admin settings
    // Route options: 'q' = Quick, 'd' = Promotional, 't' = Transactional
    // Admin can configure the route in Fast2SMS settings
    // If route is not configured in database, getFast2SMSConfig defaults to 'q', but we prefer 't' for OTP
    const config = await getFast2SMSConfig();
    // Use admin-configured route, or default to transactional ('t') for OTP if somehow not set
    const route = config.route && ['q', 'd', 't'].includes(config.route) ? config.route : 't';
    
    const result = await sendSMS(phoneNumber, message, { route });

    if (result.success) {
      auditLogger.logEvent({
        category: 'sms',
        action: 'otp_sent',
        entityType: 'otp',
        metadata: {
          phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
          otpLength: otp.length
        }
      });
    }

    return result;
  } catch (error) {
    logger.error('Failed to send OTP via Fast2SMS', {
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      error: error.message
    });
    throw error;
  }
};

/**
 * Send bulk SMS
 * @param {Array<String>} phoneNumbers - Array of phone numbers
 * @param {String} message - Message to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
const sendBulkSMS = async (phoneNumbers, message, options = {}) => {
  return sendSMS(phoneNumbers, message, options);
};

module.exports = {
  sendSMS,
  sendOTP,
  sendBulkSMS,
  isConfigured,
  getFast2SMSConfig
};
