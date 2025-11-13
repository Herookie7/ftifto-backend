const crypto = require('crypto');

const generateOrderId = () => {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TFT-${timestamp}-${randomPart}`;
};

module.exports = generateOrderId;

