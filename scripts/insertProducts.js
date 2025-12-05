const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../src/models/Product');

// Product data following the provided style
const productsData = [
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1f2'),
    title: 'Paneer Butter Masala',
    slug: 'spice-garden-restaurant-paneer-butter-masala',
    description: 'Rich and creamy paneer curry',
    image: 'https://picsum.photos/400/400?random=0.9478987094359979',
    gallery: [],
    price: 220,
    categories: [],
    tags: [],
    isActive: true,
    isFeatured: false,
    preparationTime: 15,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Half Portion (350ml)',
        price: 140,
        sku: 'PBM-HALF',
        default: false
      },
      {
        title: 'Full Portion (750ml)',
        price: 220,
        sku: 'PBM-FULL',
        default: true
      },
      {
        title: 'Family Bucket (1200ml)',
        price: 400,
        sku: 'PBM-FAM',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1f6'),
    title: 'Dal Makhani',
    slug: 'spice-garden-restaurant-dal-makhani',
    description: 'Creamy black lentils cooked overnight with butter and cream',
    image: 'https://picsum.photos/400/400?random=0.17605215360370163',
    gallery: [],
    price: 180,
    categories: [],
    tags: ['vegetarian', 'popular'],
    isActive: true,
    isFeatured: true,
    preparationTime: 20,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Half Portion',
        price: 110,
        sku: 'DM-HALF',
        default: false
      },
      {
        title: 'Full Portion',
        price: 180,
        sku: 'DM-FULL',
        default: true
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1f7'),
    title: 'Chicken Biryani',
    slug: 'spice-garden-restaurant-chicken-biryani',
    description: 'Fragrant basmati rice with spiced chicken and aromatic spices',
    image: 'https://picsum.photos/400/400?random=0.14455997698168543',
    gallery: [],
    price: 280,
    categories: [],
    tags: ['non-vegetarian', 'spicy'],
    isActive: true,
    isFeatured: true,
    preparationTime: 25,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Single Serve',
        price: 280,
        sku: 'CB-SINGLE',
        default: true
      },
      {
        title: 'Family Pack (Serves 4)',
        price: 1000,
        sku: 'CB-FAM',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1f8'),
    title: 'Veg Biryani',
    slug: 'spice-garden-restaurant-veg-biryani',
    description: 'Aromatic basmati rice with mixed vegetables and spices',
    image: 'https://picsum.photos/400/400?random=0.3444970322743921',
    gallery: [],
    price: 200,
    categories: [],
    tags: ['vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 20,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Single Serve',
        price: 200,
        sku: 'VB-SINGLE',
        default: true
      },
      {
        title: 'Family Pack (Serves 4)',
        price: 750,
        sku: 'VB-FAM',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1f9'),
    title: 'Butter Naan',
    slug: 'spice-garden-restaurant-butter-naan',
    description: 'Soft leavened bread with butter',
    image: 'https://picsum.photos/400/400?random=0.5846155772896373',
    gallery: [],
    price: 45,
    categories: [],
    tags: ['bread', 'vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 5,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Single Piece',
        price: 45,
        sku: 'BN-SINGLE',
        default: true
      },
      {
        title: 'Pack of 2',
        price: 85,
        sku: 'BN-PACK2',
        default: false
      },
      {
        title: 'Pack of 4',
        price: 160,
        sku: 'BN-PACK4',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1fa'),
    title: 'Garlic Naan',
    slug: 'spice-garden-restaurant-garlic-naan',
    description: 'Naan topped with garlic and herbs',
    image: 'https://picsum.photos/400/400?random=0.006982421648613402',
    gallery: [],
    price: 55,
    categories: [],
    tags: ['bread', 'vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 5,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Single Piece',
        price: 55,
        sku: 'GN-SINGLE',
        default: true
      },
      {
        title: 'Pack of 2',
        price: 105,
        sku: 'GN-PACK2',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1fb'),
    title: 'Roti',
    slug: 'spice-garden-restaurant-roti',
    description: 'Whole wheat flatbread',
    image: 'https://picsum.photos/400/400?random=0.0037843680921505474',
    gallery: [],
    price: 15,
    categories: [],
    tags: ['bread', 'vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 3,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Single Piece',
        price: 15,
        sku: 'RT-SINGLE',
        default: true
      },
      {
        title: 'Pack of 4',
        price: 55,
        sku: 'RT-PACK4',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1fc'),
    title: 'Paratha',
    slug: 'spice-garden-restaurant-paratha',
    description: 'Layered flatbread',
    image: 'https://picsum.photos/400/400?random=0.4867445815667737',
    gallery: [],
    price: 50,
    categories: [],
    tags: ['bread', 'vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 8,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Plain Paratha',
        price: 50,
        sku: 'PR-PLAIN',
        default: true
      },
      {
        title: 'Aloo Paratha',
        price: 70,
        sku: 'PR-ALOO',
        default: false
      },
      {
        title: 'Paneer Paratha',
        price: 90,
        sku: 'PR-PANEER',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1fd'),
    title: 'Veg Manchurian',
    slug: 'spice-garden-restaurant-veg-manchurian',
    description: 'Crispy vegetable balls in tangy sauce',
    image: 'https://picsum.photos/400/400?random=0.4522969795703764',
    gallery: [],
    price: 160,
    categories: [],
    tags: ['chinese', 'vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 15,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Gravy Style',
        price: 160,
        sku: 'VM-GRAVY',
        default: true
      },
      {
        title: 'Dry Style',
        price: 150,
        sku: 'VM-DRY',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1fe'),
    title: 'Chicken Fried Rice',
    slug: 'spice-garden-restaurant-chicken-fried-rice',
    description: 'Stir-fried rice with chicken and vegetables',
    image: 'https://picsum.photos/400/400?random=0.8122754994032619',
    gallery: [],
    price: 200,
    categories: [],
    tags: ['chinese', 'non-vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 12,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Regular',
        price: 200,
        sku: 'CFR-REG',
        default: true
      },
      {
        title: 'Extra Chicken',
        price: 250,
        sku: 'CFR-EXTRA',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc1ff'),
    title: 'Hakka Noodles',
    slug: 'spice-garden-restaurant-hakka-noodles',
    description: 'Stir-fried noodles with vegetables',
    image: 'https://picsum.photos/400/400?random=0.32098566651386595',
    gallery: [],
    price: 140,
    categories: [],
    tags: ['chinese', 'vegetarian'],
    isActive: true,
    isFeatured: false,
    preparationTime: 10,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Veg Hakka Noodles',
        price: 140,
        sku: 'HN-VEG',
        default: true
      },
      {
        title: 'Chicken Hakka Noodles',
        price: 180,
        sku: 'HN-CHICKEN',
        default: false
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc200'),
    title: 'Shahi Paneer',
    slug: 'spice-garden-restaurant-shahi-paneer',
    description: 'Paneer cubes in a thick, sweet and creamy gravy with cashews',
    image: 'https://picsum.photos/400/400?random=0.1565557623262',
    gallery: [],
    price: 220,
    categories: [],
    tags: ['vegetarian', 'popular'],
    isActive: true,
    isFeatured: true,
    preparationTime: 18,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Half Portion',
        price: 130,
        sku: 'SP-HALF',
        default: false
      },
      {
        title: 'Full Portion',
        price: 220,
        sku: 'SP-FULL',
        default: true
      }
    ],
    addons: []
  },
  {
    _id: new mongoose.Types.ObjectId('6926ff89411dec930d6dc201'),
    title: 'Kadhai Paneer',
    slug: 'spice-garden-restaurant-kadhai-paneer',
    description: 'Spicy paneer cooked with capsicum, onion and tomato masala',
    image: 'https://picsum.photos/400/400?random=0.1601050690597',
    gallery: [],
    price: 210,
    categories: [],
    tags: ['vegetarian', 'spicy'],
    isActive: true,
    isFeatured: false,
    preparationTime: 16,
    restaurant: new mongoose.Types.ObjectId('6926ff88411dec930d6dc1ea'),
    available: true,
    stock: 0,
    isOutOfStock: false,
    variations: [
      {
        title: 'Regular Spicy',
        price: 210,
        sku: 'KP-REG',
        default: true
      },
      {
        title: 'Extra Spicy',
        price: 220,
        sku: 'KP-EXTRA',
        default: false
      }
    ],
    addons: []
  }
];

async function insertProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if products already exist
    const existingProducts = await Product.find({
      _id: { $in: productsData.map(p => p._id) }
    });

    if (existingProducts.length > 0) {
      console.log(`⚠️  Found ${existingProducts.length} existing products. Updating them...`);
      
      // Update existing products
      for (const productData of productsData) {
        await Product.findByIdAndUpdate(
          productData._id,
          { $set: productData },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`✅ Updated/Upserted product: ${productData.title}`);
      }
    } else {
      // Insert new products
      const insertedProducts = await Product.insertMany(productsData, { ordered: false });
      console.log(`✅ Successfully inserted ${insertedProducts.length} products`);
      
      insertedProducts.forEach(product => {
        console.log(`   - ${product.title} (${product._id})`);
      });
    }

    console.log('\n✅ Product insertion completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting products:', error);
    
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      console.error('⚠️  Duplicate key error. Some products may already exist.');
      console.error('   Consider using update operations instead of insert.');
    }
    
    process.exit(1);
  }
}

// Run the script
insertProducts();

