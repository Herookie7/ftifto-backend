const mongoose = require('mongoose');

const rewardCoinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true
    },
    coins: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    transactionType: {
      type: String,
      enum: [
        'ORDER_COMPLETION',
        'CONVERSION_TO_WALLET',
        'ADMIN_ADJUSTMENT',
        'REFERRAL_BONUS',
        'OTHER'
      ],
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    referenceId: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

rewardCoinTransactionSchema.index({ userId: 1, createdAt: -1 });
rewardCoinTransactionSchema.index({ orderId: 1 });

module.exports = mongoose.model('RewardCoinTransaction', rewardCoinTransactionSchema);
