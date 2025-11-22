const request = require('supertest');
const app = require('../src/app');
const maintenanceService = require('../src/services/maintenance.service');

describe('Maintenance middleware', () => {
  afterEach(async () => {
    await maintenanceService.toggleMaintenance({ enabled: false });
    maintenanceService._resetCache();
  });

  it('returns 503 for write endpoints when maintenance is active', async () => {
    await maintenanceService.toggleMaintenance({
      enabled: true,
      message: 'Scheduled maintenance',
      readOnly: true
    });

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'test@example.com',
      password: 'password123'
    });

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('maintenance');
    expect(response.body.readOnly).toBe(true);
  });

  it('allows reads when maintenance is read-only', async () => {
    await maintenanceService.toggleMaintenance({
      enabled: true,
      readOnly: true
    });

    const response = await request(app).get('/api/live');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('live');
  });
});


