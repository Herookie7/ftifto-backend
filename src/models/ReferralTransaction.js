const mongoose = require('mongoose');

const referralTransactionSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    referralCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    cashbackAmount: {
      type: Number,
      required: true,
      default: 50, // Rs. 50 cashback
      min: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'CREDITED', 'CANCELLED'],
      default: 'PENDING'
    },
    creditedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

referralTransactionSchema.index({ referrerId: 1, createdAt: -1 });

module.exports = mongoose.model('ReferralTransaction', referralTransactionSchema);
