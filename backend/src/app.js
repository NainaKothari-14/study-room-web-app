const express = require('express')
const cors = require('cors')
const roomRoutes = require('./routes/room')
const fileRoutes = require('./routes/files')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/rooms', roomRoutes)
app.use('/api/files', fileRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

module.exports = app