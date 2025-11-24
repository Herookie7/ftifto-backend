const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    action: {
      type: String,
      trim: true
    },
    screen: {
      type: String,
      trim: true
    },
    file: {
      type: String,
      trim: true
    },
    parameters: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);

