import { useState } from 'react'
import { EMOJI_LIST } from '../../utils/roomUtils'

function CtrlBtn({ onClick, active, danger, special, disabled, title, children }) {
  const base = 'w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-150 active:scale-90 cursor-pointer select-none'
  const style =
    disabled ? 'bg-s-surface text-s-muted cursor-not-allowed opacity-40' :
    danger    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg' :
    active    ? 'bg-s-violet text-white shadow-lg' :
    special   ? 'bg-s-violet/20 text-violet-300 hover:bg-s-violet/30' :
                'bg-s-card hover:bg-s-border text-s-dim hover:text-s-text border border-s-border'

  return (
    <button className={`${base} ${style}`} onClick={disabled ? undefined : onClick} title={title}>
      {children}
    </button>
  )
}

export default function ControlBar({
  isMicOn, isCamOn, isScreenSharing, canShare,
  onToggleMic, onToggleCam, onScreenShare, onLeave,
  onReact, onPanelChange, activePanel
}) {
  const [showEmojis, setShowEmojis] = useState(false)

  return (
    <div className="border-t border-s-border bg-s-surface/90 backdrop-blur px-5 py-3 flex items-center justify-between relative">

      {/* Left: media controls */}
      <div className="flex items-center gap-2">
        <CtrlBtn
          onClick={onToggleMic}
          active={!isMicOn}
          danger={!isMicOn}
          title={isMicOn ? 'Mute' : 'Unmute'}>
          {isMicOn ? '🎤' : '🔇'}
        </CtrlBtn>

        <CtrlBtn
          onClick={onToggleCam}
          danger={!isCamOn}
          title={isCamOn ? 'Turn off camera' : 'Turn on camera'}>
          {isCamOn ? '📷' : '🚫'}
        </CtrlBtn>

        <CtrlBtn
          onClick={canShare || isScreenSharing ? onScreenShare : undefined}
          special={isScreenSharing}
          disabled={!canShare && !isScreenSharing}
          title={isScreenSharing ? 'Stop sharing' : canShare ? 'Share screen' : 'Someone else is sharing'}>
          🖥️
        </CtrlBtn>
      </div>

      {/* Center: emoji reactions */}
      <div className="relative">
        <CtrlBtn onClick={() => setShowEmojis(v => !v)} active={showEmojis} title="React">
          😊
        </CtrlBtn>

        {showEmojis && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 glass rounded-2xl p-3 flex gap-2 shadow-2xl z-50 animate-scale-in">
            {EMOJI_LIST.map(emoji => (
              <button key={emoji}
                className="text-2xl hover:scale-125 transition-transform cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10"
                onClick={() => { onReact(emoji); setShowEmojis(false) }}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: panels + leave */}
      <div className="flex items-center gap-2">
        {[
          { id: 'chat',         icon: '💬', label: 'Chat' },
          { id: 'participants', icon: '👥', label: 'People' },
          { id: 'files',        icon: '📎', label: 'Files' },
        ].map(p => (
          <CtrlBtn key={p.id} onClick={() => onPanelChange(p.id)}
            special={activePanel === p.id} title={p.label}>
            {p.icon}
          </CtrlBtn>
        ))}

        <div className="w-px h-8 bg-s-border mx-1" />

        <CtrlBtn onClick={onLeave} danger title="Leave room">
          📞
        </CtrlBtn>
      </div>
    </div>
  )
}