const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const SubscriptionPreference = require('../models/SubscriptionPreference');
const SubscriptionDelivery = require('../models/SubscriptionDelivery');

// Run every Sunday at 00:01 AM
const generateWeeklyDeliveriesJob = cron.schedule('1 0 * * 0', async () => {
    console.log('Running weekly subscription delivery generation job...');
    try {
        // 1. Find all active subscriptions
        const activeSubscriptions = await Subscription.find({ status: 'ACTIVE' });
        console.log(`Found ${activeSubscriptions.length} active subscriptions.`);

        const nextWeekStart = new Date();
        nextWeekStart.setDate(nextWeekStart.getDate() + 1); // Start generating from tomorrow (Monday) - adjusting for Sunday run

        let totalGenerated = 0;

        for (const sub of activeSubscriptions) {
            try {
                // 2. Get preferences for each subscription
                let preferences = await SubscriptionPreference.findOne({ subscriptionId: sub._id });

                // If no preferences, create default (TIFFIN for all days except Sunday)
                if (!preferences) {
                    preferences = await SubscriptionPreference.createDefault(sub._id);
                }

                // 3. Generate deliveries using the static method (which has duplicate checks)
                // We generate for the upcoming week
                const newDeliveries = await SubscriptionDelivery.generateWeeklyDeliveries(
                    sub._id,
                    nextWeekStart,
                    preferences.mealPreferences
                );

                totalGenerated += newDeliveries.length;
            } catch (err) {
                console.error(`Error generating deliveries for subscription ${sub._id}:`, err.message);
            }
        }

        console.log(`Job completed. Generated ${totalGenerated} new delivery entries.`);

    } catch (error) {
        console.error('Weekly delivery generation job failed:', error);
    }
}, {
    scheduled: false // Don't start immediately, let server.js start it
});

module.exports = { generateWeeklyDeliveriesJob };
