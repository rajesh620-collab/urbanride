const connectedUsers = new Map();
let ioInstance = null;

function setupWebSocket(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
}

function notifyUser(userId, event, data) {
  const socket = connectedUsers.get(String(userId));
  if (socket) socket.emit(event, data);
}

function notifyRideRoom(rideId, event, data) {
  if (ioInstance) ioInstance.to(`ride:${rideId}`).emit(event, data);
}

module.exports = {
  setupWebSocket,
  notifyUser,
  notifyRideRoom
};