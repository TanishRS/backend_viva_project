const jwt = require('jsonwebtoken');

/**
 * Socket.io setup for real-time updates across the platform.
 *
 * Rooms:
 *  - "map"    : public - clients watching the live affected-areas / relief-camp map
 *  - "alerts" : public - clients subscribed to emergency alerts
 *  - "admin"  : ADMIN ONLY - donations, new volunteers, new/verified needs.
 *               The client must connect with io({ auth: { token: <admin JWT> } }).
 *
 * Events emitted (see controllers for emit call sites):
 *  - "need:new", "need:updated", "need:verified", "need:deleted"
 *  - "donation:new", "volunteer:new"
 *  - "camp:new", "camp:updated"
 *  - "alert:new"
 *  - "map:update"
 */

// True only if the socket's handshake carries a valid JWT whose role is admin.
function isAdminSocket(socket) {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return false;
    return jwt.verify(token, process.env.JWT_SECRET).role === 'admin';
  } catch (err) {
    return false;
  }
}

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join', (room) => {
      if (!['map', 'alerts', 'admin'].includes(room)) return;

      if (room === 'admin' && !isAdminSocket(socket)) {
        socket.emit('join:denied', { room, reason: 'An admin token is required for this room' });
        return;
      }

      socket.join(room);
      socket.emit('joined', room);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSocket;
