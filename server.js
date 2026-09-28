require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/index');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' },
});

initSocket(io);

// Make io available to controllers via req.app.get('io')
app.set('io', io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Server] ReliefConnect API listening on port ${PORT}`);
    console.log(`[Server] Swagger docs at http://localhost:${PORT}/api-docs`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = server;
