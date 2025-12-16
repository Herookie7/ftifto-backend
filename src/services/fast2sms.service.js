const fetch = require('node-fetch');
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
  let phoneNumbers;
  if (Array.isArray(numbers)) {
    phoneNumbers = numbers.map(num => String(num).replace(/\D/g, '').slice(-10)).join(',');
  } else {
    phoneNumbers = String(numbers).replace(/\D/g, '').slice(-10);
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
    const response = await fetch(FAST2SMS_API_URL, {
      method: 'POST',
      headers: {
        'authorization': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Fast2SMS API error', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.message || 'Fast2SMS API request failed');
    }

    // Fast2SMS returns success status in return field
    if (data.return === true || data.return === 'true') {
      logger.info('Fast2SMS sent successfully', {
        numbers: phoneNumbers,
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
        numbers: phoneNumbers,
        error: data.message || 'Unknown error'
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
    logger.error('Fast2SMS service error', {
      error: error.message,
      numbers: phoneNumbers
    });

    auditLogger.logEvent({
      category: 'sms',
      action: 'fast2sms_error',
      severity: 'error',
      entityType: 'sms',
      metadata: {
        numbers: phoneNumbers,
        error: error.message
      }
    });

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
    // Use transactional route for OTP (route 't')
    const result = await sendSMS(phoneNumber, message, { route: 't' });
    
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
