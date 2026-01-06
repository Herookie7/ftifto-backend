const mongoose = require('mongoose');

const mealPreferenceSchema = new mongoose.Schema(
    {
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
        isEnabled: {
            type: Boolean,
            default: true
        },
        deliveryTime: {
            type: String, // "12:00", "19:00"
            trim: true
        }
    },
    { _id: false }
);

const productPreferenceSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        isPreferred: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);

const subscriptionPreferenceSchema = new mongoose.Schema(
    {
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: true,
            unique: true,
            index: true
        },
        mealPreferences: [mealPreferenceSchema],
        defaultProductPreferences: [productPreferenceSchema],
        dietaryRestrictions: [{
            type: String,
            trim: true
        }],
        specialInstructions: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
subscriptionPreferenceSchema.index({ subscriptionId: 1, 'mealPreferences.dayOfWeek': 1 });

// Method to get enabled days
subscriptionPreferenceSchema.methods.getEnabledDays = function () {
    return this.mealPreferences
        .filter(pref => pref.isEnabled)
        .map(pref => pref.dayOfWeek);
};

// Method to check if delivery is enabled for a specific day
subscriptionPreferenceSchema.methods.isDeliveryEnabled = function (dayOfWeek) {
    const pref = this.mealPreferences.find(p => p.dayOfWeek === dayOfWeek);
    return pref ? pref.isEnabled : false;
};

// Static method to create default preferences
subscriptionPreferenceSchema.statics.createDefault = function (subscriptionId) {
    const defaultMealPreferences = [
        'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
    ].map(day => ({
        dayOfWeek: day,
        mealType: 'TIFFIN',
        isEnabled: day !== 'SUNDAY', // Disabled on Sunday by default
        deliveryTime: '12:00'
    }));

    return this.create({
        subscriptionId,
        mealPreferences: defaultMealPreferences,
        defaultProductPreferences: [],
        dietaryRestrictions: []
    });
};

module.exports = mongoose.model('SubscriptionPreference', subscriptionPreferenceSchema);
