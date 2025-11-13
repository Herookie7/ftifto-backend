const mongoose = require('mongoose');

const privacyRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['deletion', 'data_portability'],
      default: 'deletion'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending'
    },
    reason: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    exportObjectKey: {
      type: String,
      trim: true
    },
    exportUrl: {
      type: String,
      trim: true
    },
    exportExpiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

privacyRequestSchema.index({ status: 1, requestedAt: 1 });
privacyRequestSchema.index({ email: 1, requestedAt: -1 });
privacyRequestSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('PrivacyRequest', privacyRequestSchema);


