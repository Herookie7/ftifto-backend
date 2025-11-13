const mongoose = require('mongoose');
const config = require('./index');

mongoose.set('strictQuery', true);

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.db.uri, {
      maxPoolSize: 10
    });
    if (config.app.nodeEnv !== 'test') {
      // eslint-disable-next-line no-console
      console.log('MongoDB connected');
      // eslint-disable-next-line no-console
      console.log('Loaded MONGO_URI');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;

