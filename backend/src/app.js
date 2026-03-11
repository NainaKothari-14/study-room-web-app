const express = require('express')
const cors = require('cors')
const roomRoutes = require('./routes/room')
const fileRoutes = require('./routes/files')

const app = express()

app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL
  ],
  credentials: true
}))

app.use(express.json())

// Routes
app.use('/api/rooms', roomRoutes)
app.use('/api/files', fileRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

module.exports = app