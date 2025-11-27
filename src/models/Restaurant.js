const mongoose = require('mongoose');
const slugify = require('slugify');

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

const polygonSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      default: []
    }
  },
  { _id: false }
);

const openingTimesSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true
    },
    times: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }
    ]
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    image: { type: String, trim: true },
    logo: { type: String, trim: true },
    address: {
      type: String,
      required: true,
      trim: true
    },
    location: locationSchema,
    deliveryBounds: polygonSchema,
    phone: { type: String, trim: true },
    cuisines: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    zone: { type: String, trim: true },
    orderPrefix: { type: String, default: 'TIF' },
    deliveryTime: { type: Number, default: 30 },
    minimumOrder: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shopType: { type: String, trim: true },
    openingTimes: [openingTimesSchema],
    notificationToken: { type: String, trim: true },
    orderId: { type: String, trim: true },
    sections: [{ type: String, trim: true }],
    keywords: [{ type: String, trim: true }],
    reviewCount: { type: Number, default: 0 },
    reviewAverage: { type: Number, default: 0 },
    restaurantUrl: { type: String, trim: true },
    stripeDetailsSubmitted: { type: Boolean, default: false },
    enableNotification: { type: Boolean, default: true },
    username: { type: String, trim: true },
    password: { type: String, trim: true },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    options: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        price: { type: Number }
      }
    ],
    addons: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        quantityMinimum: { type: Number, default: 0 },
        quantityMaximum: { type: Number, default: 1 },
        options: [
          {
            title: { type: String, trim: true },
            description: { type: String, trim: true },
            price: { type: Number }
          }
        ]
      }
    ],
    bussinessDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountName: { type: String, trim: true },
      accountCode: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

restaurantSchema.pre('save', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ 'deliveryBounds.coordinates': '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);

