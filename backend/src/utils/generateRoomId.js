const { v4: uuidv4 } = require('uuid')

function generateRoomId() {
  const part = () => uuidv4().substring(0, 5)
  return `study-${part()}-${part()}`
}

module.exports = generateRoomId