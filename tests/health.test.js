const request = require('supertest');
const app = require('../src/app');

describe('Health endpoint', () => {
  it('returns ok status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ status: 'ok' }));
  });

  it('redirects legacy /api/health to /api/v1/health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(308);
    expect(response.headers.location).toBe('/api/v1/health');
  });
});

describe('Version endpoint', () => {
  it('returns version and commit hash', async () => {
    const response = await request(app).get('/api/v1/version');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('commit', 'test-sha');
  });
});

describe('Metrics endpoint', () => {
  it('returns Prometheus metrics', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('ftifto_http_requests_total');
  });
});

describe('Health probes', () => {
  it('returns live status', async () => {
    const response = await request(app).get('/api/live');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'live');
  });

  it('returns ready status', async () => {
    const response = await request(app).get('/api/ready');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ready');
  });
});

