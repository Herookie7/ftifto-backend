const mongoose = require('mongoose');

const deliveryMenuItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

const subscriptionDeliverySchema = new mongoose.Schema(
    {
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: true,
            index: true
        },
        menuScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuSchedule'
        },
        scheduledDate: {
            type: Date,
            required: true,
            index: true
        },
        dayOfWeek: {
            type: String,
            enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
            required: true
        },
        mealType: {
            type: String,
            enum: ['TIFFIN'],
            default: 'TIFFIN'
        },
        menuItems: [deliveryMenuItemSchema],
        status: {
            type: String,
            enum: ['SCHEDULED', 'PREPARING', 'PREPARED', 'READY', 'ASSIGNED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'SKIPPED', 'CANCELLED'],
            default: 'SCHEDULED',
            index: true
        },
        deliveryTime: {
            type: String,
            trim: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        rider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        skipReason: {
            type: String,
            trim: true
        },
        deliveredAt: {
            type: Date
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
subscriptionDeliverySchema.index({ subscriptionId: 1, scheduledDate: 1 });
subscriptionDeliverySchema.index({ subscriptionId: 1, status: 1 });
subscriptionDeliverySchema.index({ menuScheduleId: 1, scheduledDate: 1 });
subscriptionDeliverySchema.index({ scheduledDate: 1, status: 1 });

// Virtual for checking if delivery can be skipped
subscriptionDeliverySchema.virtual('canSkip').get(function () {
    if (this.status !== 'SCHEDULED') return false;
    const now = new Date();
    const cutoffTime = new Date(this.scheduledDate);
    cutoffTime.setHours(cutoffTime.getHours() - 2); // 2 hours before delivery
    return now < cutoffTime;
});

// Method to mark as delivered
subscriptionDeliverySchema.methods.markDelivered = function () {
    this.status = 'DELIVERED';
    this.deliveredAt = new Date();
    return this.save();
};

// Method to skip delivery
subscriptionDeliverySchema.methods.skip = function (reason) {
    if (!this.canSkip) {
        throw new Error('Cannot skip delivery - cutoff time has passed');
    }
    this.status = 'SKIPPED';
    this.skipReason = reason || 'Customer requested skip';
    return this.save();
};

// Static method to generate weekly deliveries
subscriptionDeliverySchema.statics.generateWeeklyDeliveries = async function (
    subscriptionId,
    weekStartDate,
    mealPreferences
) {
    const deliveries = [];
    const startDate = new Date(weekStartDate);
    startDate.setHours(0, 0, 0, 0);

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    for (let i = 0; i < 7; i++) {
        const deliveryDate = new Date(startDate);
        deliveryDate.setDate(startDate.getDate() + i);
        const dayOfWeek = dayNames[deliveryDate.getDay()];

        const preference = mealPreferences.find(p => p.dayOfWeek === dayOfWeek);

        if (preference && preference.isEnabled) {
            // Check if delivery already exists for this date
            const existing = await this.findOne({
                subscriptionId,
                scheduledDate: {
                    $gte: deliveryDate,
                    $lt: new Date(deliveryDate.getTime() + 24 * 60 * 60 * 1000)
                }
            });

            if (!existing) {
                deliveries.push({
                    subscriptionId,
                    scheduledDate: deliveryDate,
                    dayOfWeek,
                    mealType: preference.mealType || 'TIFFIN',
                    deliveryTime: preference.deliveryTime || '12:00',
                    status: 'SCHEDULED',
                    menuItems: []
                });
            }
        }
    }

    if (deliveries.length > 0) {
        return await this.insertMany(deliveries);
    }
    return [];
};

module.exports = mongoose.model('SubscriptionDelivery', subscriptionDeliverySchema);
