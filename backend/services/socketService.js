let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Make sure to call setSocketIO first.');
  }
  return io;
};

module.exports = {
  setSocketIO,
  getSocketIO
};

