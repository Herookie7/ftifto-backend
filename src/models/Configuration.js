const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema(
  {
    // Currency
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },

    // Delivery
    deliveryRate: { type: Number, default: 0 },
    freeDeliveryAmount: { type: Number, default: 0 },
    costType: { type: String, default: 'fixed' },
    riderGlobalFee: { type: Number, default: 30 },

    // Google Client IDs
    webClientID: { type: String, trim: true },
    androidClientID: { type: String, trim: true },
    iOSClientID: { type: String, trim: true },
    expoClientID: { type: String, trim: true },

    // Google Maps
    googleApiKey: { type: String, trim: true },
    googleMapLibraries: { type: String, trim: true },
    googleColor: { type: String, trim: true },

    // Email (NodeMailer)
    email: { type: String, trim: true },
    emailName: { type: String, trim: true },
    password: { type: String, trim: true },
    enableEmail: { type: Boolean, default: false },

    // Stripe
    publishableKey: { type: String, trim: true },
    secretKey: { type: String, trim: true },

    // PayPal
    clientId: { type: String, trim: true },
    clientSecret: { type: String, trim: true },
    sandbox: { type: Boolean, default: false },

    // Razorpay
    razorpayKeyId: { type: String, trim: true },
    razorpayKeySecret: { type: String, trim: true },
    razorpaySandbox: { type: Boolean, default: false },

    // Fast2SMS
    fast2smsApiKey: { type: String, trim: true },
    fast2smsEnabled: { type: Boolean, default: false },
    fast2smsRoute: { type: String, trim: true, default: 'q' },

    // Cloudinary
    cloudinaryUploadUrl: { type: String, trim: true },
    cloudinaryApiKey: { type: String, trim: true },

    // Firebase
    firebaseKey: { type: String, trim: true },
    authDomain: { type: String, trim: true },
    projectId: { type: String, trim: true },
    storageBucket: { type: String, trim: true },
    msgSenderId: { type: String, trim: true },
    appId: { type: String, trim: true },
    measurementId: { type: String, trim: true },
    vapidKey: { type: String, trim: true },

    // App Config
    termsAndConditions: { type: String, trim: true },
    privacyPolicy: { type: String, trim: true },
    testOtp: { type: String, trim: true },

    // Verification
    skipMobileVerification: { type: Boolean, default: false },
    skipEmailVerification: { type: Boolean, default: false },
    skipWhatsAppOTP: { type: Boolean, default: false },

    // App Versions
    customerAppVersion: { type: String, trim: true },
    riderAppVersion: { type: String, trim: true },
    restaurantAppVersion: { type: String, trim: true },

    // Other
    twilioEnabled: { type: Boolean, default: false },
    appAmplitudeApiKey: { type: String, trim: true },
    customerAppSentryUrl: { type: String, trim: true },
    isPaidVersion: { type: Boolean, default: true },
    supportPhone: { type: String, trim: true, default: '+918823823813' }
  },
  { timestamps: true }
);

// Ensure only one configuration document exists
configurationSchema.statics.getConfiguration = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('Configuration', configurationSchema);

