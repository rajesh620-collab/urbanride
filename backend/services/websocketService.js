/**
 * WebSocket service — handles real-time communication.
 *
 * Features:
 * - Registers users on connect (maps userId → socketId)
 * - User-specific notifications
 * - Ride room broadcasting
 * - Cleanup on disconnect
 */

const { Server } = require('socket.io');

const connectedUsers = new Map();  // userId → socket
let ioInstance = null;

function setupWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[WS] Socket connected: ${socket.id}`);

    // Client sends { userId } right after connecting
    socket.on('register', ({ userId }) => {
      if (!userId) return;
      connectedUsers.set(String(userId), socket);
      socket.userId = String(userId);
      console.log(`[WS] User registered: ${userId} → ${socket.id}`);
    });

    // Join a ride room for real-time ride updates
    socket.on('join_ride_room', ({ rideId }) => {
      if (!rideId) return;
      socket.join(`ride:${rideId}`);
      console.log(`[WS] ${socket.id} joined ride:${rideId}`);
    });

    // Leave ride room
    socket.on('leave_ride_room', ({ rideId }) => {
      if (!rideId) return;
      socket.leave(`ride:${rideId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      console.log(`[WS] Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Send an event to a specific user by their userId.
 */
function notifyUser(userId, event, data) {
  const socket = connectedUsers.get(String(userId));
  if (socket) {
    socket.emit(event, data);
    return true;
  }
  return false;
}

/**
 * Broadcast an event to everyone in a ride room.
 */
function notifyRideRoom(rideId, event, data) {
  if (ioInstance) {
    ioInstance.to(`ride:${rideId}`).emit(event, data);
  }
}

/**
 * Broadcast an event to all connected users.
 */
function broadcast(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

/**
 * Check if a specific user is online.
 */
function isUserOnline(userId) {
  return connectedUsers.has(String(userId));
}

module.exports = {
  setupWebSocket,
  notifyUser,
  notifyRideRoom,
  broadcast,
  isUserOnline
};