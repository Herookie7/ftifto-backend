const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    tag: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    restaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
      }
    ],
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);

