const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    planType: {
      type: String,
      enum: ['7_DAYS', '15_DAYS', '1_MONTH', '2_MONTHS', '3_MONTHS', 'CUSTOM'],
      required: true
    },
    planName: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // Duration in days
      required: true
    },
    totalTiffins: {
      type: Number, // Total number of tiffins in subscription
      required: true
    },
    remainingTiffins: {
      type: Number,
      required: true,
      default: 0
    },
    remainingDays: {
      type: Number,
      required: true,
      default: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED'],
      default: 'ACTIVE',
      index: true
    },
    freeDelivery: {
      type: Boolean,
      default: true // Free delivery for subscription orders
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'WALLET'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING'
    },
    orderId: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ restaurantId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ userId: 1, restaurantId: 1, status: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'ACTIVE' && 
         this.endDate > new Date() && 
         this.remainingTiffins > 0 &&
         this.remainingDays > 0;
};

// Method to use a tiffin (decrement remaining)
subscriptionSchema.methods.useTiffin = function() {
  if (this.remainingTiffins > 0) {
    this.remainingTiffins -= 1;
  }
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
