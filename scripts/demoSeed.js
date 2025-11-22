const mongoose = require('mongoose');

const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

module.exports = async function runDemoSeed() {
  try {
    // Check if demo data already exists
    const demoCheck = await Restaurant.findOne({ slug: 'demo-restaurant' });
    if (demoCheck) {
      console.log('✔ Demo data already exists — skipping');
      return;
    }

    console.log('⚡ Creating demo data...');

    // 1. Demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@tifto.test',
      phone: '9999999999',
      password: 'password123',
      role: 'customer',
      isActive: true,
      phoneIsVerified: true,
      emailIsVerified: true
    });

    // 2. Demo restaurant
    const restaurant = await Restaurant.create({
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      address: 'Demo Street, India',
      image: 'https://picsum.photos/400/300',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      },
      isActive: true,
      isAvailable: true,
      owner: demoUser._id,
      deliveryTime: 30,
      minimumOrder: 0,
      tax: 10,
      rating: 4.5,
      shopType: 'restaurant',
      openingTimes: [
        {
          day: 'Monday',
          times: [{ startTime: '09:00', endTime: '22:00' }]
        }
      ]
    });

    // 3. Demo category
    const category = await Category.create({
      title: 'Main Course',
      restaurant: restaurant._id,
      order: 1,
      isActive: true
    });

    // 4. Demo products
    const products = await Product.create([
      {
        title: 'Demo Paneer Tikka',
        price: 199,
        restaurant: restaurant._id,
        image: 'https://picsum.photos/400/400',
        description: 'Delicious paneer tikka',
        available: true,
        isActive: true,
        variations: [
          { title: 'Regular', price: 199 },
          { title: 'Large', price: 299 }
        ]
      },
      {
        title: 'Demo Veg Biryani',
        price: 149,
        restaurant: restaurant._id,
        image: 'https://picsum.photos/400/400',
        description: 'Aromatic veg biryani',
        available: true,
        isActive: true,
        variations: [
          { title: 'Half', price: 149 },
          { title: 'Full', price: 249 }
        ]
      }
    ]);

    // Link products to category
    category.foods = products.map(p => p._id);
    await category.save();

    // Link category to restaurant
    restaurant.categories = [category._id];
    await restaurant.save();

    console.log('✔ Demo data created successfully');
    console.log(`   - User: ${demoUser.email}`);
    console.log(`   - Restaurant: ${restaurant.name}`);
    console.log(`   - Products: ${products.length}`);
  } catch (err) {
    console.error('❌ Demo seed error:', err.message);
    // Don't throw - allow server to continue
  }
};

