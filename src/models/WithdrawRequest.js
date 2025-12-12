const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      default: () => `WR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userType: {
      type: String,
      enum: ['SELLER', 'RIDER'],
      required: true
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: function() {
        return this.userType === 'SELLER';
      }
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.userType === 'RIDER';
      }
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'TRANSFERRED', 'CANCELLED'],
      default: 'REQUESTED'
    },
    requestTime: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

withdrawRequestSchema.index({ userId: 1, status: 1 });
withdrawRequestSchema.index({ userType: 1, status: 1 });
withdrawRequestSchema.index({ requestId: 1 });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);

