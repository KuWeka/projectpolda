const logger = require('../utils/logger');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info('User connected to WebSocket', { socketId: socket.id });

    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      logger.info('Socket joined chat room', { socketId: socket.id, chatId });
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      logger.info('Socket left chat room', { socketId: socket.id, chatId });
    });

    socket.on('join_technicians', () => {
      socket.join('technicians');
      logger.info('Socket joined technicians room', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.info('User disconnected from WebSocket', { socketId: socket.id });
    });
  });
};

module.exports = socketHandler;
