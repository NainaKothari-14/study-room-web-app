import { v4 as uuidv4 } from 'uuid'

export function generateRoomId() {
  // e.g. "study-abc12-xyz34"
  const part = () => Math.random().toString(36).substring(2, 7)
  return `study-${part()}-${part()}`
}

export function generateUserId() {
  return uuidv4()
}

export function getRoomUrl(roomId) {
  return `${window.location.origin}/room/${roomId}`
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '🎉', '🙏', '🔥', '👏']