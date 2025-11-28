const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Zone = require('../src/models/Zone');
const Banner = require('../src/models/Banner');
const Cuisine = require('../src/models/Cuisine');
const Offer = require('../src/models/Offer');
const Section = require('../src/models/Section');
const Review = require('../src/models/Review');
const Order = require('../src/models/Order');
const Configuration = require('../src/models/Configuration');

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

    // WARNING: This will drop the entire database referenced by the URI.
    // Intended for local/dev use only.
    const db = mongoose.connection.db;
    console.log(`⚠️  Dropping existing database "${db.databaseName}"...`);
    await db.dropDatabase();
    console.log('✅ Database dropped. Seeding fresh Mandsaur demo data...');

    // Create basic configuration for the platform
    await Configuration.create({
      currency: 'INR',
      currencySymbol: '₹',
      deliveryRate: 20,
      testOtp: '123456',
      skipMobileVerification: true,
      skipEmailVerification: true,
      costType: 'fixed'
    });
    console.log('✅ Created configuration document');

    // Create Zone for Mandsaur
    const zone = await Zone.create({
      title: 'Mandsaur Zone',
      description: `Delivery zone for ${MANDAUR_CITY}, ${MANDAUR_STATE}`,
      location: createMandsaurPolygon(),
      tax: 5,
      isActive: true
    });
    console.log(`✅ Created zone: ${zone.title}`);

    // Create core cuisines
    const cuisines = await Cuisine.create([
      {
        name: 'Indian',
        description: 'North & South Indian favourites from Mandsaur',
        image: 'https://images.unsplash.com/photo-1603899122634-2f24c0a286d5?w=400&q=80',
        shopType: 'restaurant'
      },
      {
        name: 'Chinese',
        description: 'Indian Chinese street food classics',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        shopType: 'restaurant'
      },
      {
        name: 'Snacks & Sweets',
        description: 'Mandsaur style namkeen and mithai',
        image: 'https://images.unsplash.com/photo-1604908176997-1251884b08a0?w=400&q=80',
        shopType: 'restaurant'
      },
      {
        name: 'Pizza & Fast Food',
        description: 'Pizzas, burgers and more',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
        shopType: 'restaurant'
      },
      {
        name: 'South Indian',
        description: 'Idli, dosa, uttapam & more',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
        shopType: 'restaurant'
      }
    ]);
    console.log(`✅ Created ${cuisines.length} cuisines`);

    // Create core users (admin, rider, customer)
    console.log('👤 Creating core users (admin, rider, customer)...');
    const [adminUser, riderUser, customerUser] = await User.create([
      {
        name: 'Mandsaur Admin',
        email: 'admin@mandsaur.test',
        phone: '9000000001',
        password: 'password123',
        role: 'admin',
        isActive: true,
        phoneIsVerified: true,
        emailIsVerified: true
      },
      {
        name: 'Mandsaur Rider',
        email: 'rider@mandsaur.test',
        phone: '9000000002',
        password: 'password123',
        role: 'rider',
        isActive: true,
        phoneIsVerified: true,
        emailIsVerified: true,
        riderProfile: {
          vehicleType: 'bike',
          licenseNumber: 'MP14-RIDER-001',
          available: true,
          location: {
            type: 'Point',
            coordinates: MANDAUR_COORDS
          }
        }
      },
      {
        name: 'Mandsaur Customer',
        email: 'customer@mandsaur.test',
        phone: '9000000003',
        password: 'password123',
        role: 'customer',
        isActive: true,
        phoneIsVerified: true,
        emailIsVerified: true,
        addressBook: [
          {
            label: 'Home',
            deliveryAddress: `Near Bus Stand, ${MANDAUR_CITY}`,
            details: '2nd Floor, Shree Apartment',
            selected: true,
            street: 'Bus Stand Road',
            city: MANDAUR_CITY,
            state: MANDAUR_STATE,
            country: MANDAUR_COUNTRY,
            postalCode: MANDAUR_PINCODE,
            location: {
              type: 'Point',
              coordinates: MANDAUR_COORDS
            }
          }
        ]
      }
    ]);
    console.log('✅ Core users created');

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

    const createdRestaurants = [];
    const allProducts = [];

    for (const restData of restaurantsData) {
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
        image: restData.image || 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
        logo: restData.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
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
        allProducts.push(...products);

        console.log(`   📦 Created category "${catData.title}" with ${products.length} products`);
      }

      restaurant.categories = categoryIds;
      await restaurant.save();

      createdRestaurants.push(restaurant);
    }

    // Create banners pointing to Mandsaur experiences
    console.log('\n🖼️  Creating banners...\n');
    await Banner.create([
      {
        title: 'Taste of Mandsaur',
        description: 'Discover the best food around Mandsaur city',
        action: 'NAVIGATE',
        screen: 'Home',
        file: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
        parameters: JSON.stringify({ zone: 'Mandsaur Zone' }),
        order: 1
      },
      {
        title: 'Evening Snacks at Gandhi Chowk',
        description: 'Hot samosas, kachori & jalebi from local favourites',
        action: 'NAVIGATE',
        screen: 'RestaurantList',
        file: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=80',
        parameters: JSON.stringify({ area: 'Gandhi Chowk', city: MANDAUR_CITY }),
        order: 2
      },
      {
        title: 'South Indian Breakfast',
        description: 'Crispy dosas and fluffy idlis near Station Road',
        action: 'NAVIGATE',
        screen: 'RestaurantList',
        file: 'https://images.unsplash.com/photo-1603899122634-2f24c0a286d5?w=1200&q=80',
        parameters: JSON.stringify({ cuisine: 'South Indian' }),
        order: 3
      }
    ]);

    // Create offers and sections
    console.log('\n🏷️  Creating offers and sections...\n');
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await Offer.create([
      {
        name: 'Mandsaur Lunch Combo',
        tag: 'LUNCH',
        description: 'Flat 20% off on lunch orders above ₹300',
        restaurants: createdRestaurants.map(r => r._id),
        discount: 20,
        discountType: 'percentage',
        startDate: now,
        endDate: inSevenDays,
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80'
      },
      {
        name: 'Evening Chai & Snacks',
        tag: 'SNACKS',
        description: 'Get ₹50 off on orders from 4–7 PM',
        restaurants: createdRestaurants.map(r => r._id),
        discount: 50,
        discountType: 'fixed',
        startDate: now,
        endDate: inSevenDays,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
      }
    ]);

    await Section.create([
      {
        name: 'Featured in Mandsaur',
        description: 'Handpicked restaurants loved by locals',
        restaurants: createdRestaurants.map(r => r._id),
        order: 1
      },
      {
        name: 'Snacks & Sweets',
        description: 'Perfect for your evening cravings',
        restaurants: createdRestaurants
          .filter(r => r.name.includes('Sweets') || r.name.includes('Tiffin'))
          .map(r => r._id),
        order: 2
      }
    ]);

    // Create sample orders & reviews
    console.log('\n🧾  Creating sample orders and reviews...\n');
    const customerAddress = customerUser.addressBook[0];

    for (const restaurant of createdRestaurants) {
      const restaurantProducts = allProducts.filter(p => p.restaurant.toString() === restaurant._id.toString());
      if (!restaurantProducts.length) continue;

      const product = restaurantProducts[0];

      const order = await Order.create({
        customer: customerUser._id,
        restaurant: restaurant._id,
        seller: null,
        rider: riderUser._id,
        items: [
          {
            product: product._id,
            title: product.title,
            description: product.description,
            image: product.image,
            quantity: 1,
            variation: {
              title: 'Regular',
              price: product.price
            },
            addons: []
          }
        ],
        orderAmount: product.price,
        paidAmount: product.price,
        deliveryCharges: 20,
        tipping: 0,
        taxationAmount: Math.round(product.price * 0.05),
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        deliveryAddress: {
          deliveryAddress: customerAddress.deliveryAddress,
          details: customerAddress.details,
          label: customerAddress.label || 'Home',
          location: customerAddress.location
        },
        zone: zone.title,
        deliveredAt: new Date(),
        timeline: [
          {
            status: 'created',
            note: 'Order created as demo data',
            updatedBy: adminUser._id
          },
          {
            status: 'delivered',
            note: 'Delivered successfully (demo)',
            updatedBy: adminUser._id
          }
        ]
      });

      await Review.create({
        order: order._id,
        restaurant: restaurant._id,
        user: customerUser._id,
        rating: restaurant.rating || 4,
        description: `Great experience at ${restaurant.name} in ${MANDAUR_CITY}!`
      });
    }

    console.log('\n✅ Mandsaur demo data created successfully!');
    console.log(`\n📍 Location: ${MANDAUR_CITY}, ${MANDAUR_STATE}, ${MANDAUR_PINCODE}`);
    console.log(`📊 Created ${restaurantsData.length} restaurants with products`);
    console.log(`📊 Cuisines: ${await Cuisine.countDocuments()}`);
    console.log(`📊 Banners: ${await Banner.countDocuments()}`);
    console.log(`📊 Offers: ${await Offer.countDocuments()}`);
    console.log(`📊 Sections: ${await Section.countDocuments()}`);
    console.log(`📊 Orders: ${await Order.countDocuments()}`);
    console.log(`📊 Reviews: ${await Review.countDocuments()}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding Mandsaur data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedMandsaurData();

