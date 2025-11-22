const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    description: {
      type: String,
      trim: true
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

