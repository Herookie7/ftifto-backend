#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const seed = async () => {
  await connectDatabase();

  console.log('Clearing existing data...');
  await Promise.all([
    Order.deleteMany({}),
    Product.deleteMany({}),
    Restaurant.deleteMany({}),
    User.deleteMany({})
  ]);

  console.log('Creating sample users...');
  const [admin, seller, rider, customer] = await User.create([
    {
      name: 'Admin User',
      email: 'admin@tifto.test',
      phone: '1000000001',
      password: 'password123',
      role: 'admin'
    },
    {
      name: 'Seller User',
      email: 'seller@tifto.test',
      phone: '1000000002',
      password: 'password123',
      role: 'seller'
    },
    {
      name: 'Rider User',
      email: 'rider@tifto.test',
      phone: '1000000003',
      password: 'password123',
      role: 'rider',
      riderProfile: {
        available: true,
        vehicleType: 'bike'
      }
    },
    {
      name: 'Customer User',
      email: 'customer@tifto.test',
      phone: '1000000004',
      password: 'password123',
      role: 'customer',
      addressBook: [
        {
          label: 'Home',
          street: '123 Demo Street',
          city: 'Sample City',
          state: 'Demo State',
          country: 'Wonderland',
          postalCode: '12345'
        }
      ]
    }
  ]);

  console.log('Creating sample restaurant...');
  const restaurant = await Restaurant.create({
    name: 'Demo Diner',
    owner: seller._id,
    address: '456 Food Court',
    location: {
      type: 'Point',
      coordinates: [104.902, 11.556]
    },
    cuisines: ['Fusion'],
    tags: ['featured'],
    openingTimes: [
      {
        day: 'Monday',
        times: [
          { startTime: '09:00', endTime: '22:00' }
        ]
      }
    ],
    isAvailable: true,
    isActive: true
  });

  seller.sellerProfile = {
    businessName: restaurant.name,
    restaurant: restaurant._id
  };
  await seller.save();

  console.log('Creating sample product...');
  const product = await Product.create({
    title: 'Signature Bowl',
    description: 'A hearty bowl with seasonal ingredients.',
    price: 9.99,
    restaurant: restaurant._id,
    variations: [
      {
        title: 'Regular',
        price: 9.99
      }
    ],
    addons: [
      {
        title: 'Extras',
        quantityMinimum: 0,
        quantityMaximum: 2,
        options: [
          {
            title: 'Avocado',
            price: 1.5
          }
        ]
      }
    ],
    available: true,
    isActive: true
  });

  console.log('Creating sample order...');
  await Order.create({
    customer: customer._id,
    restaurant: restaurant._id,
    seller: seller._id,
    rider: rider._id,
    items: [
      {
        product: product._id,
        title: product.title,
        description: product.description,
        image: product.image,
        quantity: 1,
        variation: product.variations[0],
        addons: product.addons
      }
    ],
    orderAmount: 9.99,
    paidAmount: 9.99,
    deliveryCharges: 1.5,
    tipping: 0,
    taxationAmount: 0.5,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    deliveryAddress: customer.addressBook[0],
    instructions: 'Leave at the door',
    timeline: [
      {
        status: 'created',
        note: 'Seed order created',
        updatedBy: admin._id
      }
    ]
  });

  console.log('Seed data created successfully!');
  console.table(
    [
      { role: 'admin', email: admin.email, password: 'password123' },
      { role: 'seller', email: seller.email, password: 'password123' },
      { role: 'rider', email: rider.email, password: 'password123' },
      { role: 'customer', email: customer.email, password: 'password123' }
    ],
    ['role', 'email', 'password']
  );
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});

