/**
 * USAGE: Included via npm run migrate:up
 * Purpose: Ensure critical indexes exist on orders, users, and products collections.
 */
const ensureIndexes = async (collection, indexes, logger) => {
  for (const index of indexes) {
    // eslint-disable-next-line no-await-in-loop
    await collection
      .createIndex(index.key, index.options)
      .then(() => {
        logger.info(`Ensured index ${index.options.name} on ${collection.collectionName}`);
      })
      .catch((error) => {
        if (error.codeName === 'NamespaceNotFound') {
          logger.warn(`Collection ${collection.collectionName} not found, skipping index ${index.options.name}`);
          return;
        }
        if (['IndexOptionsConflict', 'IndexKeySpecsConflict'].includes(error.codeName)) {
          logger.warn(`Index ${index.options.name} already exists on ${collection.collectionName}, skipping`);
          return;
        }
        throw error;
      });
  }
};

const dropIndexes = async (collection, indexNames, logger) => {
  for (const name of indexNames) {
    // eslint-disable-next-line no-await-in-loop
    await collection
      .dropIndex(name)
      .then(() => logger.info(`Dropped index ${name} on ${collection.collectionName}`))
      .catch((error) => {
        if (error.codeName === 'NamespaceNotFound') {
          logger.warn(`Collection ${collection.collectionName} not found, skipping drop for ${name}`);
          return;
        }
        if (error.codeName !== 'IndexNotFound') {
          throw error;
        }
        logger.warn(`Index ${name} not found on ${collection.collectionName}, skipping`);
      });
  }
};

module.exports = {
  async up({ db, logger }) {
    const orders = db.collection('orders');
    const users = db.collection('users');
    const products = db.collection('products');

    await ensureIndexes(
      orders,
      [
        { key: { orderId: 1 }, options: { name: 'orderId_1', unique: true } },
        { key: { restaurant: 1, orderStatus: 1 }, options: { name: 'restaurant_1_orderStatus_1' } },
        { key: { rider: 1, orderStatus: 1 }, options: { name: 'rider_1_orderStatus_1' } },
        { key: { customer: 1, createdAt: -1 }, options: { name: 'customer_1_createdAt_-1' } },
        { key: { zone: 1 }, options: { name: 'zone_1' } },
        { key: { 'deliveryAddress.location': '2dsphere' }, options: { name: 'deliveryAddress.location_2dsphere' } }
      ],
      logger
    );

    await ensureIndexes(
      users,
      [
        { key: { email: 1 }, options: { name: 'email_1', unique: true, sparse: true } },
        { key: { phone: 1 }, options: { name: 'phone_1', unique: true, sparse: true } },
        { key: { role: 1, isActive: 1 }, options: { name: 'role_1_isActive_1' } },
        { key: { 'riderProfile.location': '2dsphere' }, options: { name: 'riderProfile.location_2dsphere' } }
      ],
      logger
    );

    await ensureIndexes(
      products,
      [
        { key: { slug: 1 }, options: { name: 'slug_1', unique: true } },
        { key: { restaurant: 1, isActive: 1 }, options: { name: 'restaurant_1_isActive_1' } },
        { key: { categories: 1 }, options: { name: 'categories_1' } },
        { key: { tags: 1 }, options: { name: 'tags_1' } },
        { key: { isFeatured: 1 }, options: { name: 'isFeatured_1' } },
        { key: { updatedAt: -1 }, options: { name: 'updatedAt_-1' } }
      ],
      logger
    );
  },

  async down({ db, logger }) {
    const orders = db.collection('orders');
    const users = db.collection('users');
    const products = db.collection('products');

    await dropIndexes(
      orders,
      [
        'orderId_1',
        'restaurant_1_orderStatus_1',
        'rider_1_orderStatus_1',
        'customer_1_createdAt_-1',
        'zone_1',
        'deliveryAddress.location_2dsphere'
      ],
      logger
    );

    await dropIndexes(users, ['email_1', 'phone_1', 'role_1_isActive_1', 'riderProfile.location_2dsphere'], logger);

    await dropIndexes(
      products,
      ['slug_1', 'restaurant_1_isActive_1', 'categories_1', 'tags_1', 'isFeatured_1', 'updatedAt_-1'],
      logger
    );
  }
};


