const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
const logger = require('../logger');
const config = require('../config');

const MIGRATIONS_DIR = path.join(__dirname);
const HISTORY_COLLECTION = '_migration_history';
const LOCK_COLLECTION = '_migration_lock';
const LOCK_ID = 'global';
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

const listMigrationFiles = () => {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d{8,}-.*\.js$/.test(file))
    .sort();
};

const loadMigration = (filePath) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const migration = require(filePath);
  if (typeof migration.up !== 'function') {
    throw new Error(`Migration ${path.basename(filePath)} must export an async "up" function`);
  }
  if (typeof migration.down !== 'function') {
    throw new Error(`Migration ${path.basename(filePath)} must export an async "down" function`);
  }
  return migration;
};

const mapMigrations = () => {
  const files = listMigrationFiles();
  return files.map((file) => {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const migration = loadMigration(filePath);
    return {
      id: path.basename(file, '.js'),
      file,
      migration
    };
  });
};

const getCollections = (connection) => {
  const history = connection.collection(HISTORY_COLLECTION);
  const locks = connection.collection(LOCK_COLLECTION);
  return { history, locks };
};

const ensureIndexes = async ({ history, locks }) => {
  await history.createIndex({ appliedAt: 1 }, { name: 'applied_at_idx' });

  await locks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expires_at_ttl' }).catch((error) => {
    if (error.codeName !== 'IndexOptionsConflict') {
      throw error;
    }
  });
};

const acquireLock = async (locksCollection) => {
  const lockOwner = `${os.hostname()}-${process.pid}-${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TIMEOUT_MS);

  const result = await locksCollection.findOneAndUpdate(
    {
      _id: LOCK_ID,
      $or: [{ locked: { $exists: false } }, { locked: false }, { expiresAt: { $lte: now } }]
    },
    {
      $set: {
        locked: true,
        owner: lockOwner,
        lockedAt: now,
        expiresAt
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (!result.value || result.value.owner !== lockOwner) {
    throw new Error('Failed to acquire migration lock; another migration may be running.');
  }

  return lockOwner;
};

const releaseLock = async (locksCollection, lockOwner) => {
  await locksCollection.updateOne(
    {
      _id: LOCK_ID,
      owner: lockOwner
    },
    {
      $set: {
        locked: false,
        releasedAt: new Date()
      },
      $unset: {
        owner: '',
        lockedAt: '',
        expiresAt: ''
      }
    }
  );
};

const getAppliedMigrations = async (historyCollection) => {
  const history = await historyCollection
    .find({}, { projection: { _id: 1 } })
    .sort({ appliedAt: 1 })
    .toArray();
  return history.map((entry) => entry._id);
};

const runMigration = async ({ historyCollection, migration, direction }) => {
  const { id } = migration;
  const operation = migration.migration[direction];

  logger.info(`Running migration ${id} ${direction}`);

  await operation({
    db: mongoose.connection,
    client: mongoose.connection.getClient(),
    logger
  });

  const now = new Date();

  if (direction === 'up') {
    await historyCollection.insertOne({
      _id: id,
      file: migration.file,
      appliedAt: now
    });
  } else {
    await historyCollection.deleteOne({ _id: id });
  }

  logger.info(`Migration ${id} ${direction} completed`);
};

const migrateUp = async () => {
  const migrations = mapMigrations();

  if (!migrations.length) {
    logger.info('No migrations found');
    return;
  }

  await mongoose.connect(config.db.uri);

  const { history, locks } = getCollections(mongoose.connection);
  await ensureIndexes({ history, locks });
  const lockOwner = await acquireLock(locks);

  try {
    const applied = await getAppliedMigrations(history);
    const pending = migrations.filter((migration) => !applied.includes(migration.id));

    if (!pending.length) {
      logger.info('No pending migrations');
      return;
    }

    for (const migration of pending) {
      // eslint-disable-next-line no-await-in-loop
      await runMigration({ historyCollection: history, migration, direction: 'up' });
    }
  } finally {
    await releaseLock(locks, lockOwner);
    await mongoose.connection.close();
  }
};

const migrateDown = async () => {
  const migrations = mapMigrations();

  if (!migrations.length) {
    logger.info('No migrations found');
    return;
  }

  await mongoose.connect(config.db.uri);

  const { history, locks } = getCollections(mongoose.connection);
  await ensureIndexes({ history, locks });
  const lockOwner = await acquireLock(locks);

  try {
    const applied = await getAppliedMigrations(history);
    if (!applied.length) {
      logger.info('No applied migrations to rollback');
      return;
    }

    const lastMigrationId = applied[applied.length - 1];
    const migration = migrations.find((item) => item.id === lastMigrationId);

    if (!migration) {
      throw new Error(`Migration file not found for applied migration ${lastMigrationId}`);
    }

    await runMigration({ historyCollection: history, migration, direction: 'down' });
  } finally {
    await releaseLock(locks, lockOwner);
    await mongoose.connection.close();
  }
};

const listMigrations = async () => {
  const migrations = mapMigrations();
  await mongoose.connect(config.db.uri);

  try {
    const { history } = getCollections(mongoose.connection);
    const applied = await getAppliedMigrations(history);
    migrations.forEach((migration) => {
      const status = applied.includes(migration.id) ? 'applied' : 'pending';
      logger.info(`${migration.id} - ${status}`);
    });
  } finally {
    await mongoose.connection.close();
  }
};

module.exports = {
  migrateUp,
  migrateDown,
  listMigrations
};


