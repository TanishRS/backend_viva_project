/**
 * Socket.io setup for real-time updates across the platform.
 *
 * Rooms:
 *  - "map"    : clients watching the live affected-areas / relief-camp map
 *  - "alerts" : clients subscribed to emergency alerts
 *  - "admin"  : admin dashboard clients (new/verified needs, donations)
 *
 * Events emitted (see controllers for emit call sites):
 *  - "need:new", "need:updated", "need:verified"
 *  - "donation:new"
 *  - "camp:new", "camp:updated"
 *  - "alert:new"
 *  - "map:update"
 */
function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join', (room) => {
      if (['map', 'alerts', 'admin'].includes(room)) {
        socket.join(room);
        socket.emit('joined', room);
      }
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
