require('dotenv').config()
const { createServer } = require('http')
const app = require('./src/app')
const initSocket = require('./src/socket')

const PORT = process.env.PORT || 5000

const httpServer = createServer(app)
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`🚀 StudySync server running on http://localhost:${PORT}`)
})