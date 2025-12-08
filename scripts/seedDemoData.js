#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Review = require('../src/models/Review');
const Configuration = require('../src/models/Configuration');
const Cuisine = require('../src/models/Cuisine');
const Offer = require('../src/models/Offer');
const Section = require('../src/models/Section');
const Zone = require('../src/models/Zone');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// Unsplash image URLs - static URLs that don't require validation
const UNSPLASH_IMAGES = {
  restaurant: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
  ],
  product: [
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80',
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80',
    'https://images.unsplash.com/photo-1529419412599-7bb870e11810?w=400&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
    'https://images.unsplash.com/photo-1563379091339-03246963d0c8?w=400&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80'
  ]
};

const defaultOpeningTimes = [
  { day: 'Monday', times: [{ startTime: '09:00', endTime: '22:00' }] },
  { day: 'Tuesday', times: [{ startTime: '09:00', endTime: '22:00' }] },
  { day: 'Wednesday', times: [{ startTime: '09:00', endTime: '22:00' }] },
  { day: 'Thursday', times: [{ startTime: '09:00', endTime: '22:00' }] },
  { day: 'Friday', times: [{ startTime: '09:00', endTime: '23:00' }] },
  { day: 'Saturday', times: [{ startTime: '10:00', endTime: '23:00' }] },
  { day: 'Sunday', times: [{ startTime: '10:00', endTime: '22:00' }] }
];

const seed = async () => {
  // Check if mongoose is already connected
  const isAlreadyConnected = mongoose.connection.readyState === 1;
  let shouldDisconnect = false;
  
  if (!isAlreadyConnected) {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL;
    if (!mongoUri) {
      const errorMsg = 'MONGODB_URI (or MONGO_URI/MONGODB_URL) not set in environment';
      if (require.main === module) {
        console.error('❌ ERROR:', errorMsg);
        process.exit(1);
      }
      throw new Error(errorMsg);
    }

    try {
      await mongoose.connect(mongoUri, { maxPoolSize: 10 });
      console.log('✅ Connected to MongoDB');
      shouldDisconnect = true;
    } catch (error) {
      const errorMsg = `Failed to connect to MongoDB: ${error.message}`;
      if (require.main === module) {
        console.error('❌ ERROR:', errorMsg);
        process.exit(1);
      }
      throw new Error(errorMsg);
    }
  } else {
    console.log('✅ Using existing MongoDB connection');
  }

  // Safety check: Use demo marker to detect existing demo data
  const DEMO_MARKER_EMAIL = 'demo-customer@tifto.test';
  const existingDemo = await User.findOne({ email: DEMO_MARKER_EMAIL });
  
  if (existingDemo && !process.argv.includes('--force')) {
    console.log('⚠️  Demo data already exists. Use --force to re-seed.');
    if (shouldDisconnect) await mongoose.disconnect();
    process.exit(0);
  }

  // Clear existing demo data if --force flag is present
  const forceReseed = process.argv.includes('--force');
  if (forceReseed) {
    console.log('⚠️  --force flag detected. Clearing existing demo data...');
    await Promise.all([
      Review.deleteMany({}),
      Order.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Restaurant.deleteMany({}),
      Offer.deleteMany({}),
      Section.deleteMany({}),
      Cuisine.deleteMany({}),
      Zone.deleteMany({}),
      Configuration.deleteMany({}),
      User.deleteMany({ email: { $regex: /@tifto\.test$/ } })
    ]);
  }

  console.log('Creating demo customer user...');
  const customer = await User.create({
    name: 'Demo Customer',
    email: DEMO_MARKER_EMAIL,
    phone: '1000000001',
    password: 'password123',
    role: 'customer',
    isActive: true,
    addressBook: [
      {
        label: 'Home',
        deliveryAddress: '123 Main Street',
        details: 'Apartment 4B',
        selected: true,
        street: '123 Main Street',
        city: 'Phnom Penh',
        state: 'Phnom Penh',
        country: 'Cambodia',
        postalCode: '12000',
        location: {
          type: 'Point',
          coordinates: [104.900, 11.550]
        }
      }
    ]
  });

  // Create seller users for restaurants
  console.log('Creating seller users...');
  const sellers = await User.create([
    { name: 'Pizza Master', email: 'seller1@tifto.test', phone: '1000000002', password: 'password123', role: 'seller', isActive: true },
    { name: 'Burger King', email: 'seller2@tifto.test', phone: '1000000003', password: 'password123', role: 'seller', isActive: true },
    { name: 'Sushi Chef', email: 'seller3@tifto.test', phone: '1000000004', password: 'password123', role: 'seller', isActive: true },
    { name: 'Taco Master', email: 'seller4@tifto.test', phone: '1000000005', password: 'password123', role: 'seller', isActive: true },
    { name: 'Thai Kitchen', email: 'seller5@tifto.test', phone: '1000000006', password: 'password123', role: 'seller', isActive: true }
  ]);

  // Create 4 cuisines
  console.log('Creating cuisines...');
  const cuisines = await Cuisine.create([
    {
      name: 'Italian',
      description: 'Authentic Italian cuisine with pasta and pizza',
      shopType: 'restaurant',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
      isActive: true
    },
    {
      name: 'American',
      description: 'Classic American dishes and fast food',
      shopType: 'restaurant',
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80',
      isActive: true
    },
    {
      name: 'Asian',
      description: 'Diverse Asian flavors including Japanese and Thai',
      shopType: 'restaurant',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
      isActive: true
    },
    {
      name: 'Mexican',
      description: 'Authentic Mexican cuisine with tacos and burritos',
      shopType: 'restaurant',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
      isActive: true
    }
  ]);

  // Create zone
  console.log('Creating delivery zone...');
  const zone = await Zone.create({
    title: 'Phnom Penh Central',
    description: 'Central Phnom Penh delivery zone',
    location: {
      type: 'Polygon',
      coordinates: [[
        [104.890, 11.540],
        [104.920, 11.540],
        [104.920, 11.580],
        [104.890, 11.580],
        [104.890, 11.540]
      ]]
    },
    tax: 10,
    isActive: true
  });

  // Create 5 restaurants
  console.log('Creating 5 demo restaurants...');
  const restaurants = await Restaurant.create([
    {
      name: 'Pizza Palace',
      owner: sellers[0]._id,
      address: '789 Food Street, Phnom Penh',
      location: { type: 'Point', coordinates: [104.902, 11.556] },
      phone: '+855123456789',
      cuisines: ['Italian'],
      tags: ['featured', 'popular'],
      keywords: ['pizza', 'italian', 'pasta'],
      shopType: 'restaurant',
      orderPrefix: 'PIZ',
      orderId: 'PIZ001',
      deliveryTime: 30,
      minimumOrder: 5,
      tax: 10,
      commissionRate: 15,
      rating: 4.5,
      reviewCount: 25,
      reviewAverage: 4.5,
      isAvailable: true,
      isActive: true,
      openingTimes: defaultOpeningTimes,
      image: UNSPLASH_IMAGES.restaurant[0],
      logo: UNSPLASH_IMAGES.restaurant[0],
      zone: zone._id.toString(),
      stripeDetailsSubmitted: true,
      enableNotification: true
    },
    {
      name: 'Burger House',
      owner: sellers[1]._id,
      address: '321 Fast Food Lane, Phnom Penh',
      location: { type: 'Point', coordinates: [104.910, 11.560] },
      phone: '+855987654321',
      cuisines: ['American'],
      tags: ['fast-food', 'popular'],
      keywords: ['burger', 'fries', 'american'],
      shopType: 'restaurant',
      orderPrefix: 'BUR',
      orderId: 'BUR001',
      deliveryTime: 25,
      minimumOrder: 3,
      tax: 8,
      commissionRate: 12,
      rating: 4.3,
      reviewCount: 18,
      reviewAverage: 4.3,
      isAvailable: true,
      isActive: true,
      openingTimes: defaultOpeningTimes,
      image: UNSPLASH_IMAGES.restaurant[1],
      logo: UNSPLASH_IMAGES.restaurant[1],
      zone: zone._id.toString(),
      stripeDetailsSubmitted: true,
      enableNotification: true
    },
    {
      name: 'Sushi Express',
      owner: sellers[2]._id,
      address: '456 Ocean Drive, Phnom Penh',
      location: { type: 'Point', coordinates: [104.915, 11.555] },
      phone: '+855123456790',
      cuisines: ['Asian'],
      tags: ['healthy', 'premium'],
      keywords: ['sushi', 'japanese', 'asian'],
      shopType: 'restaurant',
      orderPrefix: 'SUS',
      orderId: 'SUS001',
      deliveryTime: 35,
      minimumOrder: 8,
      tax: 12,
      commissionRate: 18,
      rating: 4.7,
      reviewCount: 32,
      reviewAverage: 4.7,
      isAvailable: true,
      isActive: true,
      openingTimes: defaultOpeningTimes,
      image: UNSPLASH_IMAGES.restaurant[2],
      logo: UNSPLASH_IMAGES.restaurant[2],
      zone: zone._id.toString(),
      stripeDetailsSubmitted: true,
      enableNotification: true
    },
    {
      name: 'Taco Fiesta',
      owner: sellers[3]._id,
      address: '567 Spice Road, Phnom Penh',
      location: { type: 'Point', coordinates: [104.905, 11.565] },
      phone: '+855123456791',
      cuisines: ['Mexican'],
      tags: ['spicy', 'popular'],
      keywords: ['taco', 'mexican', 'burrito'],
      shopType: 'restaurant',
      orderPrefix: 'TAC',
      orderId: 'TAC001',
      deliveryTime: 28,
      minimumOrder: 4,
      tax: 9,
      commissionRate: 14,
      rating: 4.4,
      reviewCount: 22,
      reviewAverage: 4.4,
      isAvailable: true,
      isActive: true,
      openingTimes: defaultOpeningTimes,
      image: UNSPLASH_IMAGES.restaurant[3],
      logo: UNSPLASH_IMAGES.restaurant[3],
      zone: zone._id.toString(),
      stripeDetailsSubmitted: true,
      enableNotification: true
    },
    {
      name: 'Thai Garden',
      owner: sellers[4]._id,
      address: '890 Tropical Ave, Phnom Penh',
      location: { type: 'Point', coordinates: [104.908, 11.552] },
      phone: '+855123456792',
      cuisines: ['Asian'],
      tags: ['vegetarian', 'spicy'],
      keywords: ['thai', 'curry', 'asian'],
      shopType: 'restaurant',
      orderPrefix: 'THA',
      orderId: 'THA001',
      deliveryTime: 32,
      minimumOrder: 6,
      tax: 11,
      commissionRate: 16,
      rating: 4.6,
      reviewCount: 28,
      reviewAverage: 4.6,
      isAvailable: true,
      isActive: true,
      openingTimes: defaultOpeningTimes,
      image: UNSPLASH_IMAGES.restaurant[4],
      logo: UNSPLASH_IMAGES.restaurant[4],
      zone: zone._id.toString(),
      stripeDetailsSubmitted: true,
      enableNotification: true
    }
  ]);

  // Update seller profiles
  for (let i = 0; i < sellers.length; i++) {
    sellers[i].sellerProfile = {
      businessName: restaurants[i].name,
      restaurant: restaurants[i]._id
    };
    await sellers[i].save();
  }

  // Create 3 categories (shared across restaurants)
  console.log('Creating 3 categories...');
  const categories = await Category.create([
    {
      title: 'Main Courses',
      restaurant: restaurants[0]._id,
      order: 1,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
      isActive: true
    },
    {
      title: 'Sides',
      restaurant: restaurants[0]._id,
      order: 2,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
      isActive: true
    },
    {
      title: 'Desserts',
      restaurant: restaurants[0]._id,
      order: 3,
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
      isActive: true
    }
  ]);

  // Create 20 products distributed across restaurants (4 per restaurant)
  console.log('Creating 20 products...');
  const products = [];
  let imageIndex = 0;

  // Restaurant 1: Pizza Palace (4 products)
  products.push(
    await Product.create({
      title: 'Margherita Pizza',
      description: 'Classic pizza with tomato, mozzarella, and basil',
      price: 12.99,
      discountedPrice: 10.99,
      restaurant: restaurants[0]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Small (8")', price: 12.99, discounted: 10.99 },
        { title: 'Medium (12")', price: 18.99, discounted: 16.99 },
        { title: 'Large (16")', price: 24.99, discounted: 22.99 }
      ],
      addons: [{
        title: 'Extra Toppings',
        description: 'Add extra toppings',
        quantityMinimum: 0,
        quantityMaximum: 5,
        options: [
          { title: 'Extra Cheese', price: 2.00 },
          { title: 'Pepperoni', price: 3.00 },
          { title: 'Mushrooms', price: 2.50 }
        ]
      }],
      available: true,
      isActive: true,
      subCategory: 'Classic'
    }),
    await Product.create({
      title: 'Pepperoni Pizza',
      description: 'Pepperoni pizza with extra cheese',
      price: 14.99,
      discountedPrice: 12.99,
      restaurant: restaurants[0]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Small (8")', price: 14.99, discounted: 12.99 },
        { title: 'Medium (12")', price: 20.99, discounted: 18.99 },
        { title: 'Large (16")', price: 26.99, discounted: 24.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Meat'
    }),
    await Product.create({
      title: 'Spaghetti Carbonara',
      description: 'Creamy pasta with bacon and parmesan',
      price: 11.99,
      restaurant: restaurants[0]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 11.99 },
        { title: 'Large', price: 15.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Creamy'
    }),
    await Product.create({
      title: 'Fettuccine Alfredo',
      description: 'Creamy fettuccine with parmesan cheese',
      price: 10.99,
      restaurant: restaurants[0]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 10.99 },
        { title: 'Large', price: 14.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Creamy'
    })
  );

  // Restaurant 2: Burger House (4 products)
  products.push(
    await Product.create({
      title: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, and special sauce',
      price: 8.99,
      restaurant: restaurants[1]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Single', price: 8.99 },
        { title: 'Double', price: 12.99 }
      ],
      addons: [{
        title: 'Extras',
        description: 'Add extras to your burger',
        quantityMinimum: 0,
        quantityMaximum: 5,
        options: [
          { title: 'Extra Cheese', price: 1.50 },
          { title: 'Bacon', price: 2.50 },
          { title: 'Avocado', price: 2.00 }
        ]
      }],
      available: true,
      isActive: true,
      subCategory: 'Classic'
    }),
    await Product.create({
      title: 'Chicken Burger',
      description: 'Grilled chicken breast with mayo and veggies',
      price: 9.99,
      restaurant: restaurants[1]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 9.99 },
        { title: 'Spicy', price: 10.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Chicken'
    }),
    await Product.create({
      title: 'French Fries',
      description: 'Crispy golden fries',
      price: 4.99,
      restaurant: restaurants[1]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 4.99 },
        { title: 'Large', price: 6.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Fries'
    }),
    await Product.create({
      title: 'Onion Rings',
      description: 'Crispy battered onion rings',
      price: 5.99,
      restaurant: restaurants[1]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 5.99 },
        { title: 'Large', price: 7.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Sides'
    })
  );

  // Restaurant 3: Sushi Express (4 products)
  products.push(
    await Product.create({
      title: 'Salmon Sushi Roll',
      description: 'Fresh salmon with avocado and cucumber',
      price: 12.99,
      restaurant: restaurants[2]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: '6 pieces', price: 12.99 },
        { title: '12 pieces', price: 22.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Sushi'
    }),
    await Product.create({
      title: 'Tuna Sashimi',
      description: 'Fresh raw tuna slices',
      price: 15.99,
      restaurant: restaurants[2]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: '8 pieces', price: 15.99 },
        { title: '12 pieces', price: 22.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Sashimi'
    }),
    await Product.create({
      title: 'California Roll',
      description: 'Crab, avocado, and cucumber roll',
      price: 9.99,
      restaurant: restaurants[2]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: '6 pieces', price: 9.99 },
        { title: '12 pieces', price: 17.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Rolls'
    }),
    await Product.create({
      title: 'Miso Soup',
      description: 'Traditional Japanese miso soup',
      price: 3.99,
      restaurant: restaurants[2]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 3.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Soup'
    })
  );

  // Restaurant 4: Taco Fiesta (4 products)
  products.push(
    await Product.create({
      title: 'Beef Tacos',
      description: 'Seasoned beef with lettuce, cheese, and salsa',
      price: 8.99,
      restaurant: restaurants[3]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: '2 tacos', price: 8.99 },
        { title: '3 tacos', price: 12.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Tacos'
    }),
    await Product.create({
      title: 'Chicken Burrito',
      description: 'Grilled chicken with rice, beans, and cheese',
      price: 10.99,
      restaurant: restaurants[3]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 10.99 },
        { title: 'Large', price: 13.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Burritos'
    }),
    await Product.create({
      title: 'Guacamole & Chips',
      description: 'Fresh guacamole with crispy tortilla chips',
      price: 6.99,
      restaurant: restaurants[3]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 6.99 },
        { title: 'Large', price: 9.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Appetizers'
    }),
    await Product.create({
      title: 'Quesadilla',
      description: 'Cheese quesadilla with your choice of filling',
      price: 7.99,
      restaurant: restaurants[3]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Cheese', price: 7.99 },
        { title: 'Chicken', price: 9.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Quesadillas'
    })
  );

  // Restaurant 5: Thai Garden (4 products)
  products.push(
    await Product.create({
      title: 'Pad Thai',
      description: 'Stir-fried rice noodles with shrimp and vegetables',
      price: 11.99,
      restaurant: restaurants[4]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 11.99 },
        { title: 'Large', price: 15.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Noodles'
    }),
    await Product.create({
      title: 'Green Curry',
      description: 'Thai green curry with chicken and vegetables',
      price: 12.99,
      restaurant: restaurants[4]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Mild', price: 12.99 },
        { title: 'Spicy', price: 12.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Curry'
    }),
    await Product.create({
      title: 'Tom Yum Soup',
      description: 'Spicy and sour soup with shrimp',
      price: 9.99,
      restaurant: restaurants[4]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 9.99 },
        { title: 'Large', price: 13.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Soup'
    }),
    await Product.create({
      title: 'Mango Sticky Rice',
      description: 'Sweet mango with sticky rice and coconut milk',
      price: 7.99,
      restaurant: restaurants[4]._id,
      image: UNSPLASH_IMAGES.product[imageIndex++],
      variations: [
        { title: 'Regular', price: 7.99 }
      ],
      available: true,
      isActive: true,
      subCategory: 'Dessert'
    })
  );

  // Assign products to categories (distribute evenly)
  categories[0].foods = products.slice(0, 7).map(p => p._id); // Main courses
  categories[1].foods = products.slice(7, 15).map(p => p._id); // Sides
  categories[2].foods = products.slice(15, 20).map(p => p._id); // Desserts
  
  for (const category of categories) {
    await category.save();
  }

  // Assign categories to restaurants (first category to first restaurant, etc.)
  restaurants[0].categories = [categories[0]._id, categories[1]._id];
  restaurants[1].categories = [categories[0]._id, categories[1]._id];
  restaurants[2].categories = [categories[0]._id, categories[2]._id];
  restaurants[3].categories = [categories[0]._id, categories[1]._id];
  restaurants[4].categories = [categories[0]._id, categories[2]._id];
  
  for (const restaurant of restaurants) {
    await restaurant.save();
  }

  // Create offers and sections
  console.log('Creating offers and sections...');
  await Offer.create({
    name: 'Pizza Special',
    tag: 'SPECIAL',
    description: '20% off on all pizzas',
    restaurants: [restaurants[0]._id],
    discount: 20,
    discountType: 'percentage',
    isActive: true
  });

  await Section.create({
    name: 'Featured Restaurants',
    description: 'Our top picks',
    restaurants: restaurants.map(r => r._id),
    order: 1,
    isActive: true
  });

  // Create configuration
  console.log('Creating configuration...');
  await Configuration.create({
    currency: 'INR',
    currencySymbol: '₹',
    deliveryRate: 2.50,
    androidClientID: 'test-android-client-id',
    iOSClientID: 'test-ios-client-id',
    googleApiKey: 'test-google-api-key',
    expoClientID: 'test-expo-client-id',
    termsAndConditions: 'https://tifto.com/terms',
    privacyPolicy: 'https://tifto.com/privacy',
    testOtp: '123456',
    skipMobileVerification: false,
    skipEmailVerification: false,
    costType: 'fixed'
  });

  console.log('\n✅ Seed data created successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${await User.countDocuments()}`);
  console.log(`   - Restaurants: ${await Restaurant.countDocuments()} (5 demo restaurants)`);
  console.log(`   - Categories: ${await Category.countDocuments()} (3 categories)`);
  console.log(`   - Products: ${await Product.countDocuments()} (20 products)`);
  console.log(`   - Cuisines: ${await Cuisine.countDocuments()} (4 cuisines)`);
  console.log(`   - Orders: ${await Order.countDocuments()}`);
  console.log(`   - Reviews: ${await Review.countDocuments()}`);
  console.log(`   - Offers: ${await Offer.countDocuments()}`);
  console.log(`   - Sections: ${await Section.countDocuments()}`);
  console.log(`   - Zones: ${await Zone.countDocuments()}`);
  console.log(`   - Configuration: ${await Configuration.countDocuments()}`);

  console.log('\n👤 Demo Customer Account:');
  console.log(`   Email: ${customer.email}`);
  console.log(`   Password: password123`);

  // Only disconnect if we created the connection
  if (shouldDisconnect) {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } else {
    console.log('✅ Seed completed (using existing connection)');
  }
};

// Export as a function for automatic seeding from app.js
module.exports = async function seedDemoData() {
  try {
    await seed();
    return { success: true };
  } catch (error) {
    console.error('❌ Seed failed:', error);
    return { success: false, error: error.message };
  }
};

// CLI mode (if run manually)
if (require.main === module) {
  seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    if (mongoose.connection.readyState === 1) {
      mongoose.disconnect().finally(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}