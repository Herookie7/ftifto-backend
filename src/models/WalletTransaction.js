const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userType: {
      type: String,
      enum: ['CUSTOMER', 'SELLER', 'RIDER'],
      required: true
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true
    },
    amount: {
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
        'TOP_UP',
        'ORDER_PAYMENT',
        'REFUND',
        'CASHBACK',
        'REFERRAL_BONUS',
        'REWARD_COIN_CONVERSION',
        'WITHDRAWAL',
        'SUBSCRIPTION_PAYMENT',
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
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'COMPLETED'
    }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ userType: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
