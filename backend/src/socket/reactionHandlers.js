function reactionHandlers(io, socket) {
    socket.on('room:react', ({ roomId, emoji, userName }) => {
      if (!roomId || !emoji) return
      io.to(roomId).emit('room:reaction', { emoji, userName, at: Date.now() })
    })
  }
  
  module.exports = reactionHandlers