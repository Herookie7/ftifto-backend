const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth endpoints', () => {
  it('logs in a registered user', async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      password: 'password123',
      role: 'customer'
    });

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'test@example.com',
      password: 'password123'
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer'
    });
  });
});

