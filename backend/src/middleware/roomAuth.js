// Optional middleware to verify room password for protected rooms
const roomPasswords = {} // roomId -> password (set when room is created)

function setRoomPassword(roomId, password) {
  if (password) roomPasswords[roomId] = password
}

function roomAuth(req, res, next) {
  const { roomId } = req.params
  const { password } = req.body

  if (!roomPasswords[roomId]) return next() // No password set

  if (roomPasswords[roomId] !== password) {
    return res.status(403).json({ error: 'Incorrect room password' })
  }

  next()
}

module.exports = { roomAuth, setRoomPassword }