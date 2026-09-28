const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user info to the socket
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // console.log(`New client connected: ${socket.id}`);

    // User joins their department or role room
    socket.on('join_room', (room) => {
      if (room === socket.user.department || socket.user.role === 'ADMIN') {
         socket.join(room);
      } else {
         socket.emit('error', 'Unauthorized to join this room');
      }
    });

    // Handle incoming chat messages
    socket.on('send_message', (data) => {
      // data: { room, message, senderName, senderRole, timestamp }
      
      // Broadcast to all clients in the room (including sender if they are in the room)
      io.to(data.room).emit('receive_message', data);
    });

    // Handle announcements
    socket.on('send_announcement', (data) => {
      // data: { title, content, targetRole, targetDepartment }
      // Broadcast to everyone (or specific room)
      io.emit('receive_announcement', data);
    });

    socket.on('disconnect', () => {
      // console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
