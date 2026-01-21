const mongoose = require('mongoose');
const generateOrderId = require('../utils/generateOrderId');

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

const addonOptionSchema = new mongoose.Schema({
  // Keep IDs enabled so options have stable identifiers for the mobile app
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true }
});

const addonSchema = new mongoose.Schema({
  // Enable _id so addons have IDs as expected by the mobile client
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  quantityMinimum: { type: Number, default: 0 },
  quantityMaximum: { type: Number, default: 1 },
  options: [addonOptionSchema]
});

const variationSchema = new mongoose.Schema({
  // Enable _id so variation._id is available in GraphQL/mobile responses
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  discounted: { type: Number }
});

const orderItemSchema = new mongoose.Schema({
  // Keep existing product reference for backoffice/admin usage
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

  // Add a food field to stay backward‑compatible with the mobile app schema
  // (stored as string ID; can be a Product/ObjectId.toString())
  food: { type: String, trim: true },

  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  variation: variationSchema,
  addons: [addonSchema],
  specialInstructions: { type: String, trim: true }
});

const orderStatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    deliveryAddress: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    label: { type: String, trim: true },
    location: locationSchema
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: generateOrderId
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    items: {
      type: [orderItemSchema],
      validate: [(value) => Array.isArray(value) && value.length > 0, 'Order must include at least one item']
    },
    orderAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    tipping: { type: Number, default: 0 },
    taxationAmount: { type: Number, default: 0 },
    coupon: {
      code: { type: String, trim: true },
      discount: { type: Number, default: 0 }
    },
    riderFee: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'cash' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    orderStatus: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'ready', 'picked', 'enroute', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    status: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    reason: { type: String, trim: true },
    instructions: { type: String, trim: true },
    isPickedUp: { type: Boolean, default: false },
    isRinged: { type: Boolean, default: false },
    isRiderRinged: { type: Boolean, default: false },
    deliveryAddress: deliveryAddressSchema,
    zone: {
      type: String,
      trim: true
    },
    franchise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      index: true
    },
    expectedTime: { type: Date },
    preparationTime: { type: Number },
    acceptedAt: { type: Date },
    pickedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    assignedAt: { type: Date },
    timeline: [orderStatusHistorySchema],
    review: {
      rating: { type: Number, min: 0, max: 5 },
      comment: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, orderStatus: 1 });
orderSchema.index({ rider: 1, orderStatus: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ zone: 1 });
orderSchema.index({ franchise: 1, orderStatus: 1 });
orderSchema.index({ 'deliveryAddress.location': '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);

