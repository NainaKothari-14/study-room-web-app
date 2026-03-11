function chatHandlers(io, socket) {
    socket.on('chat:send', ({ roomId, message }) => {
      if (!roomId || !message) return
      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit('chat:message', message)
    })
  }
  
  module.exports = chatHandlers