const mongoose = require('mongoose');
const slugify = require('slugify');

const variationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    discounted: { type: Number },
    default: { type: Boolean, default: false },
    sku: { type: String, trim: true }
  },
  { _id: true }
);

const addonOptionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const addonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    quantityMinimum: { type: Number, default: 0 },
    quantityMaximum: { type: Number, default: 1 },
    options: [addonOptionSchema]
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    image: { type: String, trim: true },
    gallery: [{ type: String }],
    price: {
      type: Number,
      required: true
    },
    discountedPrice: {
      type: Number
    },
    categories: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 15 },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    variations: [variationSchema],
    addons: [addonSchema],
    available: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    isOutOfStock: { type: Boolean, default: false },
    subCategory: { type: String, trim: true },
    menuType: {
      type: String,
      enum: ['REGULAR', 'ITEMWISE'],
      default: 'REGULAR'
    },
    nutrition: {
      calories: Number,
      protein: Number,
      fat: Number,
      carbs: Number
    }
  },
  { timestamps: true }
);

productSchema.pre('save', function generateSlug(next) {
  // Generate slug first
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Auto-create default variation if no variations provided
  if (!this.variations || this.variations.length === 0) {
    const slugForSku = this.slug || (this.title ? slugify(this.title, { lower: true, strict: true }) : 'item');
    this.variations = [{
      title: 'Standard',
      price: this.price || 0,
      discounted: this.discountedPrice || undefined,
      default: true,
      sku: `${slugForSku}-std`
    }];
  } else {
    // Ensure at least one variation is marked as default
    const hasDefault = this.variations.some(v => v.default === true);
    if (!hasDefault && this.variations.length > 0) {
      this.variations[0].default = true;
    }
  }
  
  next();
});

// Text indexes for search functionality
productSchema.index({ title: 'text', description: 'text' });
// Compound indexes for common queries
productSchema.index({ restaurant: 1, isActive: 1 });
productSchema.index({ restaurant: 1, isActive: 1, available: 1 });
productSchema.index({ menuType: 1, isActive: 1 });
productSchema.index({ categories: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

