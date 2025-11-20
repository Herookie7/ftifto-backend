const mongoose = require('mongoose');
const slugify = require('slugify');

const variationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    discounted: { type: Number }
  },
  { _id: false }
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
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

