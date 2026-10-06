/**
 * Logic tests for the auth/ownership rules, with the DB models stubbed
 * (no MongoDB needed). Run: node scripts/logic-test.js
 */
process.env.JWT_SECRET = 'test_secret';
process.env.FIREBASE_MOCK = 'true';
process.env.ADMIN_SIGNUP_KEY = 'right-key';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
mongoose.set('bufferTimeoutMS', 300);
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Need = require('../models/Need');

let failed = 0;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failed++; };

const asUser = (role, id) => {
  User.findById = () => Promise.resolve({ _id: id, role, isActive: true });
  return `Bearer ${jwt.sign({ id, role }, process.env.JWT_SECRET)}`;
};

(async () => {
  const body = { name: 'A', email: 'a@a.com', password: '123456', role: 'admin' };

  // 1. admin signup without / with wrong key -> 403
  let res = await request(app).post('/api/auth/register').send(body);
  check('register role=admin, no key -> 403', res.status === 403);
  res = await request(app).post('/api/auth/register').send({ ...body, adminKey: 'wrong' });
  check('register role=admin, wrong key -> 403', res.status === 403);

  // 2. admin signup with right key gets past the key check (then hits DB layer, not 403)
  res = await request(app).post('/api/auth/register').send({ ...body, adminKey: 'right-key' });
  check('register role=admin, right key -> passes key check', res.status !== 403 && res.status !== 400);

  // 3. login validator: firebaseIdToken alone is accepted (not a 400); nothing at all is a 400
  res = await request(app).post('/api/auth/login').send({});
  check('login with empty body -> 400', res.status === 400);
  User.findOne = () => Promise.resolve(null);
  res = await request(app).post('/api/auth/login').send({ firebaseIdToken: 'abcdefgh123' });
  check('login with firebaseIdToken only -> passes validation (401 no linked user)', res.status === 401);

  // 4. Firebase login with a linked user returns a JWT
  User.findOne = () => Promise.resolve({
    _id: 'u1', role: 'donor', email: 'd@d.com', isActive: true,
    toSafeObject() { return { _id: 'u1', role: 'donor' }; },
  });
  User.updateOne = () => Promise.resolve({});
  res = await request(app).post('/api/auth/login').send({ firebaseIdToken: 'abcdefgh123', fcmToken: 'dev-token' });
  check('firebase login (linked user) -> 200 + token', res.status === 200 && !!res.body.data?.token);

  // 5. Mock Firebase refuses to run in production
  const fb = require('../utils/firebaseService');
  process.env.NODE_ENV = 'production';
  let threw = false;
  try { await fb.verifyFirebaseIdToken('abcdefgh123'); } catch (e) { threw = e.statusCode === 503; }
  process.env.NODE_ENV = 'test';
  check('mock firebase token check blocked in production -> 503', threw);

  // 6. NGO cannot verify its own need; admin can
  app.set('io', { to: () => ({ to: () => ({ emit() {} }), emit() {} }) });
  const makeNeed = () => ({
    postedBy: { toString: () => 'ngo1' },
    save() { return Promise.resolve(this); },
  });
  Need.findById = () => Promise.resolve(makeNeed());
  const id = '507f1f77bcf86cd799439011';
  let auth = asUser('ngo', 'ngo1');
  res = await request(app).put(`/api/needs/${id}`).set('Authorization', auth).send({ status: 'verified' });
  check('NGO sets own need to verified -> 403', res.status === 403);
  res = await request(app).put(`/api/needs/${id}`).set('Authorization', auth).send({ status: 'rejected' });
  check('NGO sets own need to rejected -> 403', res.status === 403);
  Need.findById = () => Promise.resolve(makeNeed());
  res = await request(app).put(`/api/needs/${id}`).set('Authorization', auth).send({ urgency: 'critical' });
  check('NGO edits own need (urgency) -> 200', res.status === 200);
  Need.findById = () => Promise.resolve(makeNeed());
  auth = asUser('admin', 'adm1');
  res = await request(app).put(`/api/needs/${id}`).set('Authorization', auth).send({ status: 'verified' });
  check('admin sets need to verified -> 200', res.status === 200);

  console.log(failed === 0 ? '\nALL LOGIC CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed ? 1 : 0);
})();
