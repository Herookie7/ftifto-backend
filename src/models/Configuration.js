const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    deliveryRate: { type: Number, default: 0 },
    androidClientID: { type: String, trim: true },
    iOSClientID: { type: String, trim: true },
    googleApiKey: { type: String, trim: true },
    expoClientID: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    privacyPolicy: { type: String, trim: true },
    testOtp: { type: String, trim: true },
    skipMobileVerification: { type: Boolean, default: false },
    skipEmailVerification: { type: Boolean, default: false },
    costType: { type: String, default: 'fixed' },
    customerAppVersion: { type: String, trim: true },
    twilioEnabled: { type: Boolean, default: false },
    appAmplitudeApiKey: { type: String, trim: true },
    customerAppSentryUrl: { type: String, trim: true }
  },
  { timestamps: true }
);

// Ensure only one configuration document exists
configurationSchema.statics.getConfiguration = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('Configuration', configurationSchema);

