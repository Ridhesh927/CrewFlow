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
      const allowedRoom = socket.user.department || 'General';
      if (room === 'General' || room === allowedRoom || socket.user.role === 'ADMIN') {
         socket.join(room);
      } else {
         socket.emit('error', 'Unauthorized to join this room');
      }
    });

    // Handle incoming chat messages
    socket.on('send_message', (data) => {
      // Enforce server-derived room, identity, role, and timestamp
      const targetRoom = data?.room || socket.user.department || 'General';
      const allowedRoom = socket.user.department || 'General';

      if (targetRoom !== 'General' && targetRoom !== allowedRoom && socket.user.role !== 'ADMIN') {
        socket.emit('error', 'Unauthorized to send message to this room');
        return;
      }

      const verifiedPayload = {
        room: targetRoom,
        message: typeof data?.message === 'string' ? data.message : '',
        senderId: socket.user.id,
        senderName: socket.user.name || socket.user.email || 'User',
        senderRole: socket.user.role,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all clients in the room (including sender if they are in the room)
      io.to(targetRoom).emit('receive_message', verifiedPayload);
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
