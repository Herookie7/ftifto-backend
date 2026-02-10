const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['CUSTOMER', 'RESTAURANT', 'RIDER'],
      required: true
    }
  },
  { timestamps: true }
);

chatMessageSchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
