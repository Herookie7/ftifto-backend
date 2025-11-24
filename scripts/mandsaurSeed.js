const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Zone = require('../src/models/Zone');

// Mandsaur coordinates: 24.0667° N, 75.0833° E
const MANDAUR_COORDS = [75.0833, 24.0667]; // [longitude, latitude]
const MANDAUR_CITY = 'Mandsaur';
const MANDAUR_STATE = 'Madhya Pradesh';
const MANDAUR_PINCODE = '458001';
const MANDAUR_COUNTRY = 'India';

// Create a polygon around Mandsaur (approximately 10km radius)
function createMandsaurPolygon() {
  const centerLon = MANDAUR_COORDS[0];
  const centerLat = MANDAUR_COORDS[1];
  const radius = 0.1; // ~10km in degrees
  
  return {
    type: 'Polygon',
    coordinates: [[
      [centerLon - radius, centerLat - radius], // SW
      [centerLon + radius, centerLat - radius], // SE
      [centerLon + radius, centerLat + radius], // NE
      [centerLon - radius, centerLat + radius], // NW
      [centerLon - radius, centerLat - radius]  // Close polygon
    ]]
  };
}

async function seedMandsaurData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if Mandsaur zone already exists
    const existingZone = await Zone.findOne({ title: { $regex: /Mandsaur/i } });
    if (existingZone) {
      console.log('⚠️  Mandsaur zone already exists. Skipping zone creation.');
    } else {
      // Create Zone for Mandsaur
      const zone = await Zone.create({
        title: 'Mandsaur Zone',
        description: `Delivery zone for ${MANDAUR_CITY}, ${MANDAUR_STATE}`,
        location: createMandsaurPolygon(),
        tax: 5,
        isActive: true
      });
      console.log(`✅ Created zone: ${zone.title}`);
    }

    // Restaurants data
    const restaurantsData = [
      {
        name: 'Spice Garden Restaurant',
        address: `Main Road, ${MANDAUR_CITY}, ${MANDAUR_PINCODE}, ${MANDAUR_STATE}`,
        phone: '9876543210',
        shopType: 'restaurant',
        cuisines: ['Indian', 'North Indian', 'Chinese'],
        deliveryTime: 30,
        minimumOrder: 100,
        tax: 5,
        rating: 4.5,
        coordinates: [75.0833, 24.0667],
        categories: [
          {
            title: 'Main Course',
            products: [
              { title: 'Dal Makhani', price: 180, description: 'Creamy black lentils cooked overnight' },
              { title: 'Paneer Butter Masala', price: 220, description: 'Rich and creamy paneer curry' },
              { title: 'Chicken Biryani', price: 250, description: 'Fragrant basmati rice with spiced chicken' },
              { title: 'Veg Biryani', price: 180, description: 'Aromatic basmati rice with mixed vegetables' }
            ]
          },
          {
            title: 'Breads',
            products: [
              { title: 'Butter Naan', price: 40, description: 'Soft leavened bread with butter' },
              { title: 'Garlic Naan', price: 50, description: 'Naan topped with garlic and herbs' },
              { title: 'Roti', price: 15, description: 'Whole wheat flatbread' },
              { title: 'Paratha', price: 45, description: 'Layered flatbread' }
            ]
          },
          {
            title: 'Chinese',
            products: [
              { title: 'Veg Manchurian', price: 150, description: 'Crispy vegetable balls in tangy sauce' },
              { title: 'Chicken Fried Rice', price: 180, description: 'Stir-fried rice with chicken and vegetables' },
              { title: 'Hakka Noodles', price: 140, description: 'Stir-fried noodles with vegetables' }
            ]
          }
        ]
      },
      {
        name: 'Mandsaur Sweets & Snacks',
        address: `Gandhi Chowk, ${MANDAUR_CITY}, ${MANDAUR_PINCODE}, ${MANDAUR_STATE}`,
        phone: '9876543211',
        shopType: 'restaurant',
        cuisines: ['Indian', 'Sweets', 'Snacks'],
        deliveryTime: 25,
        minimumOrder: 50,
        tax: 5,
        rating: 4.3,
        coordinates: [75.0900, 24.0700],
        categories: [
          {
            title: 'Sweets',
            products: [
              { title: 'Gulab Jamun', price: 60, description: '2 pieces of soft milk dumplings in sugar syrup' },
              { title: 'Rasgulla', price: 50, description: '2 pieces of spongy cottage cheese balls in syrup' },
              { title: 'Jalebi', price: 40, description: 'Crispy swirls soaked in sugar syrup' },
              { title: 'Kaju Katli', price: 300, description: 'Cashew fudge, 250g' }
            ]
          },
          {
            title: 'Snacks',
            products: [
              { title: 'Samosa', price: 15, description: 'Crispy fried pastry with spiced potato filling' },
              { title: 'Kachori', price: 20, description: 'Deep-fried pastry with lentil filling' },
              { title: 'Dhokla', price: 80, description: 'Steamed fermented chickpea snack' },
              { title: 'Pav Bhaji', price: 100, description: 'Spiced vegetable curry with buttered bread' }
            ]
          }
        ]
      },
      {
        name: 'Fresh Mart Tiffin',
        address: `Market Road, ${MANDAUR_CITY}, ${MANDAUR_PINCODE}, ${MANDAUR_STATE}`,
        phone: '9876543212',
        shopType: 'tiffin',
        cuisines: ['Tiffin', 'Daily Needs'],
        deliveryTime: 45,
        minimumOrder: 200,
        tax: 5,
        rating: 4.2,
        coordinates: [75.0800, 24.0650],
        categories: [
          {
            title: 'Fruits & Vegetables',
            products: [
              { title: 'Fresh Tomatoes', price: 40, description: '1 kg fresh tomatoes' },
              { title: 'Onions', price: 30, description: '1 kg onions' },
              { title: 'Potatoes', price: 25, description: '1 kg potatoes' },
              { title: 'Bananas', price: 50, description: '1 dozen bananas' },
              { title: 'Apples', price: 120, description: '1 kg apples' }
            ]
          },
          {
            title: 'Dairy Products',
            products: [
              { title: 'Milk', price: 60, description: '1 liter fresh milk' },
              { title: 'Curd', price: 50, description: '500g fresh curd' },
              { title: 'Butter', price: 80, description: '100g butter' },
              { title: 'Paneer', price: 200, description: '250g fresh paneer' }
            ]
          },
          {
            title: 'Staples',
            products: [
              { title: 'Basmati Rice', price: 120, description: '1 kg premium basmati rice' },
              { title: 'Wheat Flour', price: 40, description: '1 kg whole wheat flour' },
              { title: 'Sugar', price: 50, description: '1 kg sugar' },
              { title: 'Salt', price: 20, description: '1 kg iodized salt' }
            ]
          }
        ]
      },
      {
        name: 'Pizza Corner',
        address: `City Center, ${MANDAUR_CITY}, ${MANDAUR_PINCODE}, ${MANDAUR_STATE}`,
        phone: '9876543213',
        shopType: 'restaurant',
        cuisines: ['Italian', 'Fast Food', 'Pizza'],
        deliveryTime: 35,
        minimumOrder: 150,
        tax: 5,
        rating: 4.4,
        coordinates: [75.0850, 24.0680],
        categories: [
          {
            title: 'Pizzas',
            products: [
              { title: 'Margherita Pizza', price: 199, description: 'Classic cheese pizza with tomato sauce' },
              { title: 'Farmhouse Pizza', price: 299, description: 'Loaded with vegetables' },
              { title: 'Chicken Supreme', price: 349, description: 'Chicken with bell peppers and onions' },
              { title: 'Pepperoni Pizza', price: 329, description: 'Spicy pepperoni with cheese' }
            ]
          },
          {
            title: 'Sides',
            products: [
              { title: 'Garlic Bread', price: 99, description: '4 pieces of garlic bread' },
              { title: 'French Fries', price: 79, description: 'Crispy golden fries' },
              { title: 'Chicken Wings', price: 199, description: '6 pieces of spicy chicken wings' }
            ]
          }
        ]
      },
      {
        name: 'South Indian Delight',
        address: `Station Road, ${MANDAUR_CITY}, ${MANDAUR_PINCODE}, ${MANDAUR_STATE}`,
        phone: '9876543214',
        shopType: 'restaurant',
        cuisines: ['South Indian', 'Breakfast', 'Dosa'],
        deliveryTime: 20,
        minimumOrder: 80,
        tax: 5,
        rating: 4.6,
        coordinates: [75.0750, 24.0620],
        categories: [
          {
            title: 'Dosas',
            products: [
              { title: 'Plain Dosa', price: 60, description: 'Crispy fermented rice crepe' },
              { title: 'Masala Dosa', price: 80, description: 'Dosa with spiced potato filling' },
              { title: 'Onion Dosa', price: 70, description: 'Dosa with onions' },
              { title: 'Rava Dosa', price: 90, description: 'Crispy semolina dosa' }
            ]
          },
          {
            title: 'Idlis & Vadas',
            products: [
              { title: 'Idli (2 pieces)', price: 40, description: 'Steamed rice cakes' },
              { title: 'Vada (2 pieces)', price: 50, description: 'Crispy lentil donuts' },
              { title: 'Sambar', price: 30, description: 'Spicy lentil stew' },
              { title: 'Coconut Chutney', price: 20, description: 'Fresh coconut chutney' }
            ]
          },
          {
            title: 'Uttapam',
            products: [
              { title: 'Plain Uttapam', price: 70, description: 'Thick savory pancake' },
              { title: 'Onion Uttapam', price: 80, description: 'Uttapam with onions' },
              { title: 'Tomato Uttapam', price: 85, description: 'Uttapam with tomatoes' }
            ]
          }
        ]
      }
    ];

    console.log('\n🍽️  Creating restaurants and products...\n');

    for (const restData of restaurantsData) {
      // Check if restaurant already exists
      const existingRest = await Restaurant.findOne({ name: restData.name, address: { $regex: MANDAUR_CITY } });
      if (existingRest) {
        console.log(`⚠️  Restaurant "${restData.name}" already exists. Skipping...`);
        continue;
      }

      // Create owner user
      const owner = await User.create({
        name: `${restData.name} Owner`,
        email: `${restData.name.toLowerCase().replace(/\s+/g, '')}@mandsaur.test`,
        phone: restData.phone,
        password: 'password123',
        role: 'seller',
        isActive: true,
        phoneIsVerified: true,
        emailIsVerified: true
      });

      // Create restaurant
      const restaurant = await Restaurant.create({
        name: restData.name,
        address: restData.address,
        location: {
          type: 'Point',
          coordinates: restData.coordinates
        },
        phone: restData.phone,
        cuisines: restData.cuisines,
        zone: 'Mandsaur Zone',
        owner: owner._id,
        deliveryTime: restData.deliveryTime,
        minimumOrder: restData.minimumOrder,
        tax: restData.tax,
        rating: restData.rating,
        shopType: restData.shopType,
        isActive: true,
        isAvailable: true,
        openingTimes: [
          { day: 'MON', times: [{ startTime: '08:00', endTime: '22:00' }] },
          { day: 'TUE', times: [{ startTime: '08:00', endTime: '22:00' }] },
          { day: 'WED', times: [{ startTime: '08:00', endTime: '22:00' }] },
          { day: 'THU', times: [{ startTime: '08:00', endTime: '22:00' }] },
          { day: 'FRI', times: [{ startTime: '08:00', endTime: '22:00' }] },
          { day: 'SAT', times: [{ startTime: '08:00', endTime: '22:00' }] },
          { day: 'SUN', times: [{ startTime: '09:00', endTime: '21:00' }] }
        ]
      });

      console.log(`✅ Created restaurant: ${restaurant.name}`);

      // Create categories and products
      const categoryIds = [];
      for (const catData of restData.categories) {
        // Create unique slug by including restaurant name
        const uniqueSlug = `${restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, '-')}-${catData.title.toLowerCase().replace(/\s+/g, '-')}`;
        
        const category = await Category.create({
          title: catData.title,
          slug: uniqueSlug,
          restaurant: restaurant._id,
          order: restData.categories.indexOf(catData) + 1,
          isActive: true
        });

        const products = await Product.create(
          catData.products.map(prod => {
            // Create unique slug by including restaurant name
            const uniqueSlug = `${restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, '-')}-${prod.title.toLowerCase().replace(/\s+/g, '-')}`;
            return {
              title: prod.title,
              slug: uniqueSlug,
              price: prod.price,
              description: prod.description,
              restaurant: restaurant._id,
              available: true,
              isActive: true,
              image: `https://picsum.photos/400/400?random=${Math.random()}`
            };
          })
        );

        category.foods = products.map(p => p._id);
        await category.save();
        categoryIds.push(category._id);

        console.log(`   📦 Created category "${catData.title}" with ${products.length} products`);
      }

      restaurant.categories = categoryIds;
      await restaurant.save();
    }

    console.log('\n✅ Mandsaur demo data created successfully!');
    console.log(`\n📍 Location: ${MANDAUR_CITY}, ${MANDAUR_STATE}, ${MANDAUR_PINCODE}`);
    console.log(`📊 Created ${restaurantsData.length} restaurants with products\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding Mandsaur data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedMandsaurData();

