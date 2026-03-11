import { useEffect, useRef } from 'react'
import { useRoomContext } from '../../context/RoomContext'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

export default function ChatPanel({ roomId, localUser, onSend }) {
  const { messages } = useRoomContext()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text) => {
    if (!text.trim()) return
    onSend(roomId, {
      id: Date.now(),
      text: text.trim(),
      sender: localUser?.name || 'You',
      senderId: localUser?.id,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-study-border">
        <h3 className="font-display font-semibold text-study-text">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.length === 0 && (
          <div className="text-center text-study-muted text-sm font-body mt-8">
            <p className="text-2xl mb-2">💬</p>
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id || i}
            message={msg}
            isOwn={msg.senderId === localUser?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  )
}