const express = require('express')
const { v4: uuidv4 } = require('uuid')
const router = express.Router()

// In-memory room metadata (in production: use Redis or DB)
const roomMeta = {}

// POST /api/rooms — create a new room
router.post('/', (req, res) => {
  const { name, password } = req.body
  const roomId = `study-${uuidv4().substring(0, 8)}`
  roomMeta[roomId] = {
    id: roomId,
    name: name || `Study Room ${roomId}`,
    password: password || null,
    createdAt: new Date().toISOString(),
  }
  res.json({ roomId, ...roomMeta[roomId] })
})

// GET /api/rooms/:roomId — get room info
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params
  const room = roomMeta[roomId]
  if (!room) {
    // Room may exist via socket join without REST creation — that's okay
    return res.json({ id: roomId, exists: false })
  }
  res.json({ ...room, hasPassword: !!room.password })
})

// POST /api/rooms/:roomId/verify — verify password
router.post('/:roomId/verify', (req, res) => {
  const { roomId } = req.params
  const { password } = req.body
  const room = roomMeta[roomId]
  if (!room || !room.password) return res.json({ valid: true })
  res.json({ valid: room.password === password })
})

module.exports = router