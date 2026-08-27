module.exports = (io) => {
  io.on('connection', (socket) => {
    // console.log(`New client connected: ${socket.id}`);

    // User joins their department or role room
    socket.on('join_room', (room) => {
      socket.join(room);
      // console.log(`Socket ${socket.id} joined room ${room}`);
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
