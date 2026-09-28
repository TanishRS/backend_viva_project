/**
 * Structural smoke test — verifies the Express app boots, routes mount,
 * validation/auth middleware fire correctly, and JSON error shape is
 * consistent — WITHOUT requiring a live MongoDB connection.
 * (Sandbox has no network access to fetch a real/in-memory mongod binary;
 * this exercises the HTTP layer directly instead.)
 */
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.FIREBASE_MOCK = 'true';

const mongoose = require('mongoose');
mongoose.set('bufferTimeoutMS', 500); // fail fast instead of the 10s default when no DB is connected

const request = require('supertest');
const app = require('../app');

let failed = 0;
function check(label, cond) {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    console.log(`FAIL  ${label}`);
    failed++;
  }
}

(async () => {
  // Health check
  let res = await request(app).get('/api/health');
  check('GET /api/health -> 200', res.status === 200 && res.body.success === true);

  // Root
  res = await request(app).get('/');
  check('GET / -> 200', res.status === 200);

  // Swagger docs mounted
  res = await request(app).get('/api-docs/');
  check('GET /api-docs/ -> mounted (200 or 301)', [200, 301].includes(res.status));

  // Auth validation: missing fields -> 400
  res = await request(app).post('/api/auth/register').send({});
  check('POST /api/auth/register (empty body) -> 400', res.status === 400 && res.body.success === false);

  // Auth validation: bad email
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'not-an-email', password: '123456' });
  check('POST /api/auth/register (bad email) -> 400', res.status === 400);

  // Login validation
  res = await request(app).post('/api/auth/login').send({ email: 'x@x.com' });
  check('POST /api/auth/login (missing password) -> 400', res.status === 400);

  // Protected route without token -> 401
  res = await request(app).get('/api/volunteers');
  check('GET /api/volunteers (no token) -> 401', res.status === 401);

  // Admin-only route without token -> 401 (not 403, since auth runs first)
  res = await request(app).get('/api/admin/needs');
  check('GET /api/admin/needs (no token) -> 401', res.status === 401);

  // Public route: needs listing works without auth (will fail at DB call,
  // but should not fail at routing/middleware — expect a 500 from the DB
  // layer since Mongo isn't connected, NOT a 404 route-not-found or crash)
  res = await request(app).get('/api/needs');
  check(
    'GET /api/needs (no auth needed, routes to controller) -> not 404',
    res.status !== 404
  );

  // Public map route reachable
  res = await request(app).get('/api/map/affected-areas');
  check('GET /api/map/affected-areas -> not 404', res.status !== 404);

  // Alerts emergency route reachable and ordered before generic route
  res = await request(app).get('/api/alerts/emergency');
  check('GET /api/alerts/emergency -> not 404', res.status !== 404);

  // Unknown route -> 404 with consistent JSON shape
  res = await request(app).get('/api/does-not-exist');
  check('GET /api/does-not-exist -> 404', res.status === 404 && res.body.success === false);

  // Invalid Mongo ID param -> 400 via validator
  res = await request(app).get('/api/needs/not-a-valid-id');
  check('GET /api/needs/:badId -> 400', res.status === 400);

  console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : failed + ' CHECK(S) FAILED'}`);
  process.exit(failed === 0 ? 0 : 1);
})();
