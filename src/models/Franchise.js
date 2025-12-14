const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point', 'Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { _id: false }
);

const franchiseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    area: {
      type: String,
      trim: true,
      index: true
    },
    workingArea: {
      type: locationSchema,
      required: true
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contactPerson: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    }
  },
  { timestamps: true }
);

franchiseSchema.index({ workingArea: '2dsphere' });
franchiseSchema.index({ city: 1, area: 1 });

module.exports = mongoose.model('Franchise', franchiseSchema);
