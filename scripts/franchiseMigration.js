/**
 * Franchise Data Migration Script
 * 
 * This script assigns a default franchise to all existing data
 * that doesn't have a franchise assignment.
 * 
 * Run this BEFORE enabling franchise features in production.
 * 
 * Usage:
 *   node scripts/franchiseMigration.js
 * 
 * Or run directly in MongoDB shell/Atlas
 */

const mongoose = require('mongoose');
const Franchise = require('../src/models/Franchise');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const Order = require('../src/models/Order');
const WalletTransaction = require('../src/models/WalletTransaction');

// Configuration
const DEFAULT_FRANCHISE_NAME = 'Default Franchise';
const DEFAULT_FRANCHISE_CITY = 'Mumbai';
const DEFAULT_FRANCHISE_AREA = 'Central';

// Default working area (covers all of Mumbai)
const DEFAULT_WORKING_AREA = {
    type: 'Polygon',
    coordinates: [[
        [72.7760, 18.8640], // Southwest
        [72.7760, 19.2760], // Northwest
        [73.0360, 19.2760], // Northeast
        [73.0360, 18.8640], // Southeast
        [72.7760, 18.8640]  // Close polygon
    ]]
};

const migrateFranchiseData = async () => {
    try {
        console.log('🚀 Starting Franchise Data Migration...\n');

        // Step 1: Find or create default franchise
        console.log('📍 Step 1: Setting up default franchise...');
        let defaultFranchise = await Franchise.findOne({ name: DEFAULT_FRANCHISE_NAME });

        if (!defaultFranchise) {
            // Find the first admin or super-admin to be the owner
            const adminUser = await User.findOne({
                role: { $in: ['admin', 'super-admin'] }
            });

            if (!adminUser) {
                throw new Error('No admin user found. Please create an admin user first.');
            }

            defaultFranchise = await Franchise.create({
                name: DEFAULT_FRANCHISE_NAME,
                city: DEFAULT_FRANCHISE_CITY,
                area: DEFAULT_FRANCHISE_AREA,
                workingArea: DEFAULT_WORKING_AREA,
                owner: adminUser._id,
                isActive: true,
                contactPerson: {
                    name: adminUser.name,
                    email: adminUser.email,
                    phone: adminUser.phone
                }
            });

            console.log(`✅ Created default franchise: ${defaultFranchise.name} (ID: ${defaultFranchise._id})`);
        } else {
            console.log(`✅ Using existing default franchise: ${defaultFranchise.name} (ID: ${defaultFranchise._id})`);
        }

        console.log('');

        // Step 2: Migrate Users (sellers and riders)
        console.log('👥 Step 2: Migrating users...');
        const usersToMigrate = await User.find({
            franchise: { $exists: false },
            role: { $in: ['seller', 'rider'] }
        });

        if (usersToMigrate.length > 0) {
            const userResult = await User.updateMany(
                {
                    franchise: { $exists: false },
                    role: { $in: ['seller', 'rider'] }
                },
                { $set: { franchise: defaultFranchise._id } }
            );

            console.log(`✅ Migrated ${userResult.modifiedCount} users (sellers and riders)`);
        } else {
            console.log('ℹ️  No users to migrate');
        }

        console.log('');

        // Step 3: Migrate Restaurants
        console.log('🏪 Step 3: Migrating restaurants...');
        const restaurants = await Restaurant.find({
            franchise: { $exists: false }
        });

        if (restaurants.length > 0) {
            const restaurantResult = await Restaurant.updateMany(
                { franchise: { $exists: false } },
                { $set: { franchise: defaultFranchise._id } }
            );

            console.log(`✅ Migrated ${restaurantResult.modifiedCount} restaurants`);
        } else {
            console.log('ℹ️  No restaurants to migrate');
        }

        console.log('');

        // Step 4: Migrate Orders
        console.log('📦 Step 4: Migrating orders...');
        const orders = await Order.find({
            franchise: { $exists: false }
        });

        if (orders.length > 0) {
            const orderResult = await Order.updateMany(
                { franchise: { $exists: false } },
                { $set: { franchise: defaultFranchise._id } }
            );

            console.log(`✅ Migrated ${orderResult.modifiedCount} orders`);
        } else {
            console.log('ℹ️  No orders to migrate');
        }

        console.log('');

        // Step 5: Migrate Wallet Transactions
        console.log('💰 Step 5: Migrating wallet transactions...');
        const transactions = await WalletTransaction.find({
            franchise: { $exists: false }
        });

        if (transactions.length > 0) {
            const transactionResult = await WalletTransaction.updateMany(
                { franchise: { $exists: false } },
                { $set: { franchise: defaultFranchise._id } }
            );

            console.log(`✅ Migrated ${transactionResult.modifiedCount} wallet transactions`);
        } else {
            console.log('ℹ️  No wallet transactions to migrate');
        }

        console.log('');

        // Step 6: Verification
        console.log('🔍 Step 6: Verifying migration...');

        const verificationResults = {
            users: await User.countDocuments({ franchise: null, role: { $in: ['seller', 'rider'] } }),
            restaurants: await Restaurant.countDocuments({ franchise: null }),
            orders: await Order.countDocuments({ franchise: null }),
            transactions: await WalletTransaction.countDocuments({ franchise: null })
        };

        console.log('Unmigrated records:');
        console.log(`  - Users (sellers/riders): ${verificationResults.users}`);
        console.log(`  - Restaurants: ${verificationResults.restaurants}`);
        console.log(`  - Orders: ${verificationResults.orders}`);
        console.log(`  - Wallet Transactions: ${verificationResults.transactions}`);

        const totalUnmigrated = Object.values(verificationResults).reduce((sum, count) => sum + count, 0);

        console.log('');

        if (totalUnmigrated === 0) {
            console.log('✅ Migration completed successfully! All records have franchise assignments.');
        } else {
            console.warn(`⚠️  Migration completed with ${totalUnmigrated} unmigrated records.`);
            console.warn('   This may be expected for customers or old data.');
        }

        console.log('');
        console.log('📊 Migration Summary:');
        console.log(`   Default Franchise ID: ${defaultFranchise._id}`);
        console.log(`   Franchise Name: ${defaultFranchise.name}`);
        console.log('   Ready for franchise-based operations!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        throw error;
    }
};

// Run migration if called directly
if (require.main === module) {
    const connectDatabase = require('../src/config/database');

    (async () => {
        try {
            console.log('Connecting to database...');
            await connectDatabase();
            console.log('Database connected.\n');

            await migrateFranchiseData();

            console.log('\n✅ Migration script completed successfully!');
            console.log('You can now enable franchise features.');

            process.exit(0);
        } catch (error) {
            console.error('\n❌ Migration script failed!');
            console.error(error);
            process.exit(1);
        }
    })();
}

module.exports = migrateFranchiseData;
