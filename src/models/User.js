const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    details: { type: String, trim: true },
    selected: { type: Boolean, default: false },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
    location: locationSchema,
    instructions: { type: String, trim: true }
  },
  { timestamps: true }
);

const riderProfileSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    available: { type: Boolean, default: true },
    location: locationSchema,
    lastSeenAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const sellerProfileSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    notificationToken: { type: String, trim: true },
    enableNotification: { type: Boolean, default: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'rider', 'admin'],
      default: 'customer'
    },
    avatar: { type: String, trim: true },
    image: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true
    },
    phoneIsVerified: { type: Boolean, default: false },
    emailIsVerified: { type: Boolean, default: false },
    isOrderNotification: { type: Boolean, default: true },
    isOfferNotification: { type: Boolean, default: true },
    favourite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    userType: { type: String, trim: true }, // 'apple', 'google', 'facebook', 'email', 'phone'
    notificationToken: { type: String, trim: true },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    addressBook: [addressSchema],
    sellerProfile: sellerProfileSchema,
    riderProfile: {
      vehicleType: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
      available: { type: Boolean, default: true },
      location: locationSchema,
      lastSeenAt: { type: Date, default: Date.now },
      accountNumber: { type: String, trim: true },
      currentWalletAmount: { type: Number, default: 0 },
      totalWalletAmount: { type: Number, default: 0 },
      withdrawnWalletAmount: { type: Number, default: 0 },
      licenseDetails: {
        licenseNumber: { type: String, trim: true },
        expiryDate: { type: String, trim: true },
        licenseImage: { type: String, trim: true }
      },
      vehicleDetails: {
        vehicleType: { type: String, trim: true },
        vehicleNumber: { type: String, trim: true },
        vehicleModel: { type: String, trim: true },
        vehicleImage: { type: String, trim: true }
      }
    },
    preferences: {
      language: { type: String, default: 'en' },
      marketingOptIn: { type: Boolean, default: false }
    },
    pushTokens: [{ type: String }]
  },
  { timestamps: true }
);

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ 'riderProfile.location': '2dsphere' });

module.exports = mongoose.model('User', userSchema);

