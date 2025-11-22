process.env.AWS_S3_BUCKET = 'test-privacy-exports';
process.env.AWS_S3_REGION = 'us-east-1';

const mockSend = jest.fn();
const mockSignedUrl = 'https://example.com/export-url';

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    PutObjectCommand: jest.fn().mockImplementation((input) => input),
    GetObjectCommand: jest.fn().mockImplementation((input) => input)
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue(mockSignedUrl)
}));

const request = require('supertest');
const app = require('../src/app');
const PrivacyRequest = require('../src/models/PrivacyRequest');
const User = require('../src/models/User');

describe('Privacy request endpoints', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('creates a deletion privacy request', async () => {
    const response = await request(app).post('/api/privacy/request-deletion').send({
      email: 'user@example.com',
      reason: 'Please delete my data'
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('requestId');
    expect(response.body.status).toBe('pending');

    const record = await PrivacyRequest.findById(response.body.requestId);
    expect(record).not.toBeNull();
    expect(record.email).toBe('user@example.com');
  });

  it('fetches status for an existing request', async () => {
    const requestRecord = await PrivacyRequest.create({
      email: 'status@example.com',
      type: 'deletion',
      status: 'processing'
    });

    const response = await request(app).get(`/api/privacy/status/${requestRecord.id}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('processing');
    expect(response.body.requestId).toBe(requestRecord.id);
  });

  it('provides a signed URL for data portability requests', async () => {
    await User.create({
      name: 'Export User',
      email: 'export@example.com',
      phone: '1234567890',
      password: 'Password123!'
    });

    const response = await request(app).post('/api/privacy/request-portability').send({
      email: 'export@example.com'
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('downloadUrl', mockSignedUrl);
    expect(response.body).toHaveProperty('requestId');

    const created = await PrivacyRequest.findById(response.body.requestId);
    expect(created.type).toBe('data_portability');
    expect(created.exportUrl).toBe(mockSignedUrl);
  });
});

