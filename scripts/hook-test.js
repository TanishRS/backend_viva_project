/**
 * Runs the User pre-save hook for real (no DB needed) to make sure the
 * password gets hashed and the hook doesn't crash on this Mongoose version.
 */
const User = require('../models/User');
(async () => {
  const doc = new User({ name: 'T', email: 't@t.com', password: 'password123', role: 'donor' });
  await User.schema.s.hooks.execPre('save', doc, []);
  const hashed = doc.password !== 'password123' && doc.password.startsWith('$2');
  const matches = await doc.comparePassword('password123');
  console.log(`${hashed ? 'PASS' : 'FAIL'}  pre-save hook hashes password`);
  console.log(`${matches ? 'PASS' : 'FAIL'}  comparePassword works on the hash`);
  // unmodified password must be left alone (no double hashing)
  doc.$__reset && doc.$__reset();
  const before = doc.password;
  await User.schema.s.hooks.execPre('save', doc, []);
  console.log(`${doc.password === before ? 'PASS' : 'FAIL'}  hook doesn't re-hash an unchanged password`);
  process.exit(hashed && matches ? 0 : 1);
})().catch((e) => { console.error('FAIL  hook threw:', e.message); process.exit(1); });
