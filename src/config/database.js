const mongoose = require('mongoose');
const config = require('./index');

mongoose.set('strictQuery', true);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
const SERVER_SELECTION_TIMEOUT_MS = 10000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDatabase = async () => {
  let attempt = 0;
  let hasLoggedWhitelistHint = false;

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    try {
      await mongoose.connect(config.db.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS
      });

      if (config.app.nodeEnv !== 'test') {
        // eslint-disable-next-line no-console
        console.log('MongoDB connected');
        // eslint-disable-next-line no-console
        console.log('Loaded MONGO_URI');
      }

      // Run demo seed after DB connection (safe & idempotent)
      if (config.app.nodeEnv === 'production' || config.app.isRender) {
        try {
          const runDemoSeed = require('../../scripts/demoSeed');
          await runDemoSeed();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('Demo seed skipped:', err.message);
        }
      }

      return;
    } catch (error) {
      const isTimeoutError = error?.name === 'MongooseServerSelectionError';

      // eslint-disable-next-line no-console
      console.error(
        `MongoDB connection attempt ${attempt} failed: ${error.message}`
      );

      if (isTimeoutError && !hasLoggedWhitelistHint) {
        hasLoggedWhitelistHint = true;
        // eslint-disable-next-line no-console
        console.error(
          '❌ MongoDB connection failed. Add 0.0.0.0/0 to your MongoDB Atlas IP Access List.'
        );
      }

      if (attempt >= MAX_RETRIES) {
        // eslint-disable-next-line no-console
        console.error(
          `Exceeded ${MAX_RETRIES} MongoDB connection attempts. Exiting process.`
        );
        process.exit(1);
      }

      // eslint-disable-next-line no-console
      console.error(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
      await delay(RETRY_DELAY_MS);
    }
  }
};

module.exports = connectDatabase;

