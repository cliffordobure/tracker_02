// Helper function to emit socket events
const emitNotification = (io, room, notificationData) => {
  io.to(room).emit('notification', notificationData);
};

module.exports = {
  emitNotification
};


