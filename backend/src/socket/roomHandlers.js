// In-memory room store: { roomId: [ { id, name, socketId, isMicOn, isCamOn } ] }
const rooms = {}

function roomHandlers(io, socket) {

  // ── Room join/leave ──────────────────────────────────────────────────────────

  socket.on('room:join', ({ roomId, user }) => {
    if (!roomId || !user) return

    socket.join(roomId)

    if (!rooms[roomId]) rooms[roomId] = []
    rooms[roomId] = rooms[roomId].filter(p => p.id !== user.id)
    rooms[roomId].push({ ...user, socketId: socket.id, isMicOn: true, isCamOn: true })

    // Tell existing peers a new person joined (they'll initiate offers)
    socket.to(roomId).emit('peer:joined', { peerId: user.id, name: user.name, avatar: user.avatar || null })

    // Send full participant list to everyone
    io.to(roomId).emit('room:participants', rooms[roomId])

    socket.data.roomId = roomId
    socket.data.userId = user.id

    console.log(`${user.name} joined room ${roomId} (${rooms[roomId].length} total)`)
  })

  socket.on('room:leave', ({ roomId, userId }) => {
    handleLeave(io, socket, roomId, userId)
  })

  // Relay cam on/off state to all peers in room
  socket.on('cam:state', ({ roomId, from, isCamOn, name, avatar }) => {
    socket.to(roomId).emit('cam:state', { from, isCamOn, name, avatar })
  })

  // Relay mic mute/unmute state to all peers in room
  socket.on('mic:state', ({ roomId, from, isMicOn, name, avatar }) => {
    socket.to(roomId).emit('mic:state', { from, isMicOn, name, avatar })
  })

  // Broadcast screen share state to everyone else in room
  socket.on('room:screenshare', ({ roomId, userId, sharing }) => {
    socket.to(roomId).emit('room:screenshare', { userId, sharing })
  })

  socket.on('room:share-file', ({ roomId, fileInfo }) => {
    socket.to(roomId).emit('room:file-shared', fileInfo)
  })

  socket.on('disconnect', () => {
    const { roomId, userId } = socket.data || {}
    if (roomId && userId) handleLeave(io, socket, roomId, userId)
  })

  // ── WebRTC Signaling relay ───────────────────────────────────────────────────
  // The server just forwards these to the right socket — it never touches SDP.

  socket.on('webrtc:offer', ({ roomId, to, from, sdp }) => {
    const target = findSocket(rooms[roomId], to)
    if (target) io.to(target).emit('webrtc:offer', { from, sdp })
  })

  socket.on('webrtc:answer', ({ roomId, to, from, sdp, name, avatar }) => {
    const target = findSocket(rooms[roomId], to)
    if (target) io.to(target).emit('webrtc:answer', { from, sdp, name, avatar })
  })

  socket.on('webrtc:ice', ({ roomId, to, from, candidate }) => {
    const target = findSocket(rooms[roomId], to)
    if (target) io.to(target).emit('webrtc:ice', { from, candidate })
  })
}

// ── helpers ──────────────────────────────────────────────────────────────────

function findSocket(participants, userId) {
  return participants?.find(p => p.id === userId)?.socketId || null
}

function handleLeave(io, socket, roomId, userId) {
  if (!rooms[roomId]) return
  rooms[roomId] = rooms[roomId].filter(p => p.id !== userId)

  socket.to(roomId).emit('peer:left', { peerId: userId })
  io.to(roomId).emit('room:participants', rooms[roomId])

  if (rooms[roomId].length === 0) {
    delete rooms[roomId]
    console.log(`Room ${roomId} deleted (empty)`)
  }

  socket.leave(roomId)
  console.log(`User ${userId} left room ${roomId}`)
}

module.exports = roomHandlers