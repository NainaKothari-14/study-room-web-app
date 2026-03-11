export default function EmojiReactions({ reactions }) {
    if (!reactions?.length) return null
  
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none z-50">
        {reactions.map(r => (
          <div key={r.id} className="reaction-float flex flex-col items-center">
            <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
            {r.userName && (
              <span className="text-study-muted text-xs font-body mt-1 bg-black/60 px-2 py-0.5 rounded-full">
                {r.userName}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }