/**
 * Migration Script: Add default variations to products without variations
 * 
 * This script finds all products that have empty variations array
 * and adds a default "Standard" variation based on the product's price.
 * 
 * Run with: node scripts/fix-products-without-variations.js
 */

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const slugify = require('slugify');
require('dotenv').config();

async function fixProductsWithoutVariations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all products with empty variations array
    const productsWithoutVariations = await Product.find({
      $or: [
        { variations: { $exists: false } },
        { variations: { $size: 0 } }
      ]
    });

    console.log(`\n📊 Found ${productsWithoutVariations.length} products without variations`);

    if (productsWithoutVariations.length === 0) {
      console.log('✅ All products already have variations!');
      await mongoose.disconnect();
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const product of productsWithoutVariations) {
      try {
        // Generate slug if not exists
        if (!product.slug && product.title) {
          product.slug = slugify(product.title, { lower: true, strict: true });
        }

        const slugForSku = product.slug || (product.title ? slugify(product.title, { lower: true, strict: true }) : 'item');
        
        // Create default variation
        const defaultVariation = {
          title: 'Standard',
          price: product.price || 0,
          discounted: product.discountedPrice || undefined,
          default: true,
          sku: `${slugForSku}-std`
        };

        // Add the default variation
        product.variations = [defaultVariation];

        // Save the product
        await product.save();
        updated++;
        console.log(`✅ Updated: ${product.title} (${product._id})`);
      } catch (error) {
        errors++;
        console.error(`❌ Error updating ${product.title} (${product._id}):`, error.message);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Successfully updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total processed: ${productsWithoutVariations.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
fixProductsWithoutVariations();

