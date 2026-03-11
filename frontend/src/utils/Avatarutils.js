// Preset avatar suggestions (emoji-style illustrations using colored SVGs)
export const PRESET_AVATARS = [
  { id: 'cat',     emoji: '🐱', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { id: 'panda',   emoji: '🐼', bg: 'linear-gradient(135deg,#6b7280,#111827)' },
  { id: 'fox',     emoji: '🦊', bg: 'linear-gradient(135deg,#f97316,#dc2626)' },
  { id: 'bunny',   emoji: '🐰', bg: 'linear-gradient(135deg,#ec4899,#f9a8d4)' },
  { id: 'bear',    emoji: '🐻', bg: 'linear-gradient(135deg,#92400e,#d97706)' },
  { id: 'koala',   emoji: '🐨', bg: 'linear-gradient(135deg,#9ca3af,#4b5563)' },
  { id: 'penguin', emoji: '🐧', bg: 'linear-gradient(135deg,#1e3a5f,#60a5fa)' },
  { id: 'frog',    emoji: '🐸', bg: 'linear-gradient(135deg,#16a34a,#86efac)' },
  { id: 'alien',   emoji: '👾', bg: 'linear-gradient(135deg,#7c3aed,#06b6d4)' },
  { id: 'robot',   emoji: '🤖', bg: 'linear-gradient(135deg,#0891b2,#6366f1)' },
  { id: 'wizard',  emoji: '🧙', bg: 'linear-gradient(135deg,#6d28d9,#4c1d95)' },
  { id: 'astronaut', emoji: '👨‍🚀', bg: 'linear-gradient(135deg,#0f172a,#3b82f6)' },
]

// Generate a consistent gradient from a name (same name = same color)
const GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#7c3aed)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#10b981)',
  'linear-gradient(135deg,#f43f5e,#7c3aed)',
]

export function getNameGradient(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?'
}