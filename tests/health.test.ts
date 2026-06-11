import request from 'supertest';
import { createApp } from '../src/app';

// Smoke tests that don't require a database connection — they exercise the
// HTTP layer (routing, middleware, error envelope) so CI always has something
// meaningful to run.
const app = createApp();

describe('Matic API smoke tests', () => {
  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
  });

  it('GET / returns the welcome payload', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.docs).toBe('/docs');
  });

  it('unknown routes return a 404 envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects login with invalid body (validation)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
