import { useState } from 'react'

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <div className="p-3 border-t border-study-border">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
          placeholder="Send a message..."
          className="flex-1 bg-study-card border border-study-border rounded-xl px-3 py-2.5 text-study-text font-body text-sm placeholder-study-muted focus:outline-none focus:border-study-accent transition-colors"
        />
        <button
          onClick={handleSubmit}
          className="icon-btn bg-study-accent hover:bg-study-accent-light text-white w-10 h-10 rounded-xl"
          disabled={!text.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  )
}