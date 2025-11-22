const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.TOKEN_EXPIRY = '1h';
  process.env.CORS_ORIGINS = '*';
  process.env.GIT_COMMIT_SHA = 'test-sha';
  process.env.API_BASE_URL = 'http://localhost:8001/api';
  process.env.ENABLE_CLUSTER = 'false';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany()));
});

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
  await mongoose.disconnect();
});

