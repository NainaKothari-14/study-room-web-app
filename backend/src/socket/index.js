const { Server } = require('socket.io')
const roomHandlers = require('./roomHandlers')
const chatHandlers = require('./chatHandlers')
const reactionHandlers = require('./reactionHandlers')

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    roomHandlers(io, socket)
    chatHandlers(io, socket)
    reactionHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

module.exports = initSocket