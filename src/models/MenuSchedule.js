const mongoose = require('mongoose');

const menuScheduleSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    scheduleType: {
      type: String,
      enum: ['DAILY', 'WEEKLY'],
      required: true
    },
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: function() {
        return this.scheduleType === 'WEEKLY';
      }
    },
    date: {
      type: Date,
      required: function() {
        return this.scheduleType === 'DAILY';
      }
    },
    menuItems: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      priceOverride: {
        type: Number,
        min: 0
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

menuScheduleSchema.index({ restaurantId: 1, scheduleType: 1, dayOfWeek: 1 });
menuScheduleSchema.index({ restaurantId: 1, scheduleType: 1, date: 1 });

module.exports = mongoose.model('MenuSchedule', menuScheduleSchema);
