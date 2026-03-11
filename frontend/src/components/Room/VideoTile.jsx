import { useEffect, useRef } from 'react'
import { getInitial, getNameGradient, PRESET_AVATARS } from '../../utils/Avatarutils'

// Renders the correct avatar — preset emoji, uploaded photo, or initial letter
function AvatarDisplay({ name, avatar, size }) {
  if (avatar?.type === 'upload' && avatar.value) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <img src={avatar.value} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  if (avatar?.type === 'preset' && avatar.value) {
    const p = PRESET_AVATARS.find(a => a.id === avatar.value)
    if (p) return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.48, flexShrink: 0 }}>
        {p.emoji}
      </div>
    )
  }
  // Default: first initial with name-based gradient (like Google Meet)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: getNameGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.42, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, userSelect: 'none' }}>
        {getInitial(name)}
      </span>
    </div>
  )
}

export default function VideoTile({ stream, name, avatar, isLocal, isCamOn, isMicOn }) {
  const videoRef = useRef(null)
  const camOn = isCamOn !== false   // default true
  const micOn = isMicOn !== false   // default true
  const showVideo = stream && camOn

  useEffect(() => {
    if (!videoRef.current) return
    if (stream) {
      // Always reassign — this forces the browser to rebind even if it's
      // a new MediaStream wrapping the same underlying tracks (screen share swap)
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.srcObject = null
    }
  }, [stream])

  return (
    <div style={{ position: 'relative', background: '#18181f', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', border: '1px solid #252530' }} className="tile-enter">

      {/* ── Video OR Avatar ── */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        /* Cam off — show avatar centered, like Google Meet */
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'linear-gradient(160deg, #1a1a24 0%, #0f0f16 100%)',
          position: 'relative',
        }}>
          {/* Soft glow behind avatar */}
          <div style={{
            position: 'absolute', width: 120, height: 120, borderRadius: '50%',
            background: getNameGradient(name), opacity: 0.15, filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />
          {/* Gradient ring around avatar */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899, #06b6d4)',
            padding: 2.5, borderRadius: '50%',
            boxShadow: '0 0 24px rgba(124,58,237,0.35)',
          }}>
            <div style={{ background: '#18181f', borderRadius: '50%', padding: 3 }}>
              <AvatarDisplay name={name} avatar={avatar} size={72} />
            </div>
          </div>
          <span style={{ color: '#8888a8', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Camera off
          </span>
        </div>
      )}

      {/* ── Bottom gradient + name bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        padding: '20px 12px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#fff', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isLocal ? `${name} (You)` : name}
        </span>
        {!micOn && (
          <span style={{
            background: 'rgba(220,38,38,0.85)', color: '#fff', fontSize: 11,
            padding: '2px 7px', borderRadius: 8, marginLeft: 6, flexShrink: 0,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            🔇 Muted
          </span>
        )}
      </div>

      {/* ── You badge (top left) ── */}
      {isLocal && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(124,58,237,0.25)', color: '#c4b5fd',
          fontSize: 11, padding: '3px 8px', borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
          border: '1px solid rgba(124,58,237,0.3)',
        }}>
          You
        </div>
      )}
    </div>
  )
}