/**
 * Real Socket.io server + real clients (no database needed): checks the room rules
 * and that events reach the right listeners. Run: node scripts/socket-test.js
 */
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const app = require('../app');
const initSocket = require('../sockets/index');

let failed = 0;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failed++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = http.createServer(app);
  const io = new Server(server);
  initSocket(io);
  app.set('io', io);
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}`;

  const adminToken = jwt.sign({ id: 'a1', role: 'admin' }, process.env.JWT_SECRET);
  const donorToken = jwt.sign({ id: 'd1', role: 'donor' }, process.env.JWT_SECRET);

  const mk = (auth) => {
    const s = connect(url, { auth, transports: ['websocket'] });
    s.log = { joined: [], denied: [], events: [] };
    s.on('joined', (r) => s.log.joined.push(r));
    s.on('join:denied', (i) => s.log.denied.push(i.room));
    ['need:new', 'alert:new', 'donation:new'].forEach((e) => s.on(e, () => s.log.events.push(e)));
    s.on('connect', () => ['map', 'alerts', 'admin'].forEach((r) => s.emit('join', r)));
    return s;
  };
  const anon = mk({});
  const donor = mk({ token: donorToken });
  const bad = mk({ token: 'not-a-jwt' });
  const admin = mk({ token: adminToken });
  await wait(800);

  check('anonymous client joins map + alerts', anon.log.joined.includes('map') && anon.log.joined.includes('alerts'));
  check('anonymous client is denied the admin room', anon.log.denied.includes('admin') && !anon.log.joined.includes('admin'));
  check('donor token is denied the admin room', donor.log.denied.includes('admin'));
  check('garbage token is denied the admin room', bad.log.denied.includes('admin'));
  check('admin token joins the admin room', admin.log.joined.includes('admin'));

  io.to('map').to('admin').emit('need:new', { title: 'x' });
  io.to('alerts').emit('alert:new', { title: 'Cyclone', message: 'm' });
  io.to('admin').emit('donation:new', { type: 'funds', amount: 10000 });
  await wait(400);

  check('everyone on map gets need:new', anon.log.events.includes('need:new') && admin.log.events.includes('need:new'));
  check('everyone on alerts gets alert:new', anon.log.events.includes('alert:new'));
  check('admin gets donation:new', admin.log.events.includes('donation:new'));
  check('non-admins do NOT get donation:new', !anon.log.events.includes('donation:new') && !donor.log.events.includes('donation:new'));

  [anon, donor, bad, admin].forEach((s) => s.close());
  io.close();
  console.log(failed === 0 ? '\nALL SOCKET CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed ? 1 : 0);
})();
