/**
 * OTP Storage Service
 * Stores OTPs temporarily in memory with expiration
 * In production, consider using Redis for distributed systems
 */

const otpStore = new Map(); // In-memory storage: key -> { otp, expiresAt, type }
const OTP_EXPIRY_MINUTES = 10; // OTP expires after 10 minutes

/**
 * Generate a 6-digit OTP
 * @returns {String} 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP with expiration
 * @param {String} key - Unique key (email or phone)
 * @param {String} otp - OTP code
 * @param {String} type - Type of OTP: 'email', 'phone', 'password_reset'
 * @param {Number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {String} The stored OTP
 */
const storeOTP = (key, otp, type = 'phone', expiryMinutes = OTP_EXPIRY_MINUTES) => {
  const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
  
  otpStore.set(key, {
    otp,
    expiresAt,
    type,
    createdAt: Date.now()
  });

  // Clean up expired OTPs periodically
  cleanupExpiredOTPs();

  return otp;
};

/**
 * Verify OTP
 * @param {String} key - Unique key (email or phone)
 * @param {String} otp - OTP code to verify
 * @param {String} type - Type of OTP (optional, for additional validation)
 * @returns {Boolean} True if OTP is valid, false otherwise
 */
const verifyOTP = (key, otp, type = null) => {
  const stored = otpStore.get(key);

  if (!stored) {
    return false;
  }

  // Check if expired
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return false;
  }

  // Check type if provided
  if (type && stored.type !== type) {
    return false;
  }

  // Verify OTP
  if (stored.otp === otp) {
    // Remove OTP after successful verification (one-time use)
    otpStore.delete(key);
    return true;
  }

  return false;
};

/**
 * Get stored OTP (for testing/debugging)
 * @param {String} key - Unique key
 * @returns {Object|null} Stored OTP data or null
 */
const getOTP = (key) => {
  const stored = otpStore.get(key);
  
  if (!stored) {
    return null;
  }

  // Check if expired
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return null;
  }

  return stored;
};

/**
 * Remove OTP from storage
 * @param {String} key - Unique key
 */
const removeOTP = (key) => {
  otpStore.delete(key);
};

/**
 * Clean up expired OTPs
 */
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
};

/**
 * Clear all OTPs (for testing)
 */
const clearAll = () => {
  otpStore.clear();
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  getOTP,
  removeOTP,
  cleanupExpiredOTPs,
  clearAll
};

