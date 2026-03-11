import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomId, generateUserId } from '../utils/roomUtils'
import { useRoomContext } from '../context/RoomContext'
import { PRESET_AVATARS, getNameGradient, getInitial } from '../utils/Avatarutils'

// ── pure-CSS design tokens so nothing depends on Tailwind custom config ────────
const C = {
  bg:       '#0a0a0f',
  surface:  '#111118',
  card:     '#18181f',
  border:   '#252530',
  text:     '#f0f0f8',
  dim:      '#8888a8',
  muted:    '#55556a',
  violet:   '#7c3aed',
  pink:     '#ec4899',
  grad:     'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
  gradText: 'linear-gradient(135deg, #a78bfa, #ec4899)',
}

// Reusable inline-safe button
function GradBtn({ onClick, children, style = {}, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.grad,
        color: '#fff',
        border: 'none',
        borderRadius: 16,
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: hov ? 0.88 : 1,
        transform: hov ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 0.15s, transform 0.15s',
        boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function Input({ value, onChange, onKeyDown, placeholder, type = 'text', mono }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        background: C.surface,
        border: `1.5px solid ${focused ? C.violet : C.border}`,
        borderRadius: 14,
        padding: '14px 20px',
        color: C.text,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Plus Jakarta Sans', sans-serif",
        fontSize: mono ? 13 : 16,
        outline: 'none',
        transition: 'border-color 0.2s',
        caretColor: '#a78bfa',
        boxSizing: 'border-box',
      }}
      className="placeholder-[#55556a]"
    />
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { setRoomId, setLocalUser } = useRoomContext()
  const [name, setName]         = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab]           = useState('create')
  const [error, setError]       = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [step, setStep]         = useState(1)
  const fileRef    = useRef(null)
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)

  // Lobby state
  const [lobbyMic, setLobbyMic] = useState(true)
  const [lobbyCam, setLobbyCam] = useState(true)
  const [lobbyStream, setLobbyStream] = useState(null)

  // Start camera preview when entering step 3
  useEffect(() => {
    if (step !== 3) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setLobbyStream(null)
      return
    }
    // Try to get camera — if denied, just show avatar (don't block the UI)
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => {
          streamRef.current = s
          // Apply lobby prefs to the stream
          s.getAudioTracks().forEach(t => t.enabled = lobbyMic)
          if (!lobbyCam) s.getVideoTracks().forEach(t => t.stop())
          setLobbyStream(s)
        })
        .catch(() => {
          setLobbyCam(false)
          setLobbyStream(null)
        })
    } else {
      setLobbyCam(false)
      setLobbyStream(null)
    }
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [step])

  // Toggle cam in lobby
  const toggleLobbyCam = async () => {
    const next = !lobbyCam
    setLobbyCam(next)
    if (streamRef.current) {
      if (!next) {
        streamRef.current.getVideoTracks().forEach(t => t.stop())
      } else {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          const t = s.getVideoTracks()[0]
          streamRef.current.getVideoTracks().forEach(old => streamRef.current.removeTrack(old))
          streamRef.current.addTrack(t)
          if (videoRef.current) videoRef.current.srcObject = new MediaStream(streamRef.current.getTracks())
        } catch (_) {}
      }
    }
  }

  const toggleLobbyMic = () => {
    const next = !lobbyMic
    setLobbyMic(next)
    streamRef.current?.getAudioTracks().forEach(t => t.enabled = next)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSelectedAvatar({ type: 'upload', value: ev.target.result })
    reader.readAsDataURL(file)
  }

  const proceed = () => {
    if (!name.trim()) return setError('Please enter your name first')
    if (tab === 'join' && !joinCode.trim()) return setError('Please paste a room code first')
    setError(''); setStep(2)
  }

  const proceedToLobby = () => setStep(3)

  useEffect(() => {
    if (videoRef.current && lobbyStream) {
      videoRef.current.srcObject = lobbyStream
    }
  }, [lobbyStream])

  const enter = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return setError('Please enter your name')
    const trimmedCode = joinCode.trim()
    if (tab === 'join' && !trimmedCode) return setError('Please paste a room code')
    const avatar = selectedAvatar || { type: 'initial', value: null }
    const userId = generateUserId()
    const roomId = tab === 'create' ? generateRoomId() : trimmedCode
    // Stop lobby preview stream before room starts its own
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch(_) {}
    streamRef.current = null
    setRoomId(roomId)
    setLocalUser({ id: userId, name: trimmedName, avatar, startMic: lobbyMic, startCam: lobbyCam })
    navigate(`/room/${roomId}`)
  }

  // Avatar preview component
  const AvatarPreview = ({ size = 80 }) => {
    if (selectedAvatar?.type === 'upload') {
      return (
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}>
          <img src={selectedAvatar.value} alt="you" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )
    }
    if (selectedAvatar?.type === 'preset') {
      const p = PRESET_AVATARS.find(a => a.id === selectedAvatar.value)
      return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.46 }}>
          {p.emoji}
        </div>
      )
    }
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: name ? getNameGradient(name) : C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.42, color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
          {name ? getInitial(name) : '?'}
        </span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>

      {/* Ambient blobs */}
      {[
        { top: '-10%', left: '10%',  w: 500, color: '#7c3aed', op: 0.18 },
        { bottom: '-10%', right: '10%', w: 420, color: '#ec4899', op: 0.14 },
        { top: '40%', right: '-5%',  w: 300, color: '#06b6d4', op: 0.10 },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute', width: b.w, height: b.w, borderRadius: '50%',
          background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
          opacity: b.op, filter: 'blur(80px)', pointerEvents: 'none',
          top: b.top, bottom: b.bottom, left: b.left, right: b.right,
        }} />
      ))}

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }} className="anim-slide-up">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              📚
            </div>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 36,
              background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              StudySync
            </span>
          </div>
          <p style={{ color: C.dim, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Virtual study rooms for focused minds
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(24,24,31,0.9)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24,
          padding: 32, boxShadow: '0 0 60px rgba(124,58,237,0.15)',
        }}>

          {step === 3 ? (
            <>
              {/* ── LOBBY: camera preview + mic/cam toggles ── */}
              <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                ← Back
              </button>

              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 4 }}>
                Ready to join?
              </p>
              <p style={{ color: C.dim, fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 20 }}>
                Set up your camera and microphone
              </p>

              {/* Camera preview */}
              <div style={{ position: 'relative', background: '#18181f', borderRadius: 18, overflow: 'hidden', aspectRatio: '16/9', marginBottom: 16, border: `1px solid ${C.border}` }}>
                {lobbyCam && lobbyStream ? (
                  <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(160deg,#1a1a24,#0f0f16)' }}>
                    <div style={{ background: C.grad, padding: 2.5, borderRadius: '50%', boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}>
                      <div style={{ background: '#18181f', borderRadius: '50%', padding: 3 }}>
                        <AvatarPreview size={64} />
                      </div>
                    </div>
                    <span style={{ color: C.muted, fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Camera off</span>
                  </div>
                )}
                {/* Name label */}
                <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 10px' }}>
                  <span style={{ color: '#fff', fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 500 }}>{name} (You)</span>
                </div>
              </div>

              {/* Toggle buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button onClick={toggleLobbyMic} style={{
                  flex: 1, padding: '12px', borderRadius: 14,
                  border: `1.5px solid ${lobbyMic ? C.border : '#dc2626'}`,
                  background: lobbyMic ? C.surface : 'rgba(220,38,38,0.12)',
                  color: lobbyMic ? C.text : '#f87171',
                  cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s',
                }}>
                  {lobbyMic ? '🎙️ Mic On' : '🔇 Mic Off'}
                </button>
                <button onClick={toggleLobbyCam} style={{
                  flex: 1, padding: '12px', borderRadius: 14,
                  border: `1.5px solid ${lobbyCam ? C.border : '#dc2626'}`,
                  background: lobbyCam ? C.surface : 'rgba(220,38,38,0.12)',
                  color: lobbyCam ? C.text : '#f87171',
                  cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s',
                }}>
                  {lobbyCam ? '📷 Cam On' : '🚫 Cam Off'}
                </button>
              </div>

              <GradBtn onClick={enter} style={{ width: '100%', padding: '15px 24px', fontSize: 16 }}>
                {tab === 'create' ? '✦ Create Room' : '→ Join Room'}
              </GradBtn>
            </>
          ) : step === 1 ? (
            <>
              {/* Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: C.dim, fontSize: 11, fontFamily: "'Plus Jakarta Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                  Your Name
                </label>
                <Input
                  value={name}
                  placeholder="e.g. Naina Kothari"
                  onChange={e => { setName(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && proceed()}
                />
              </div>

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 6, background: C.surface, borderRadius: 14, padding: 4, marginBottom: 20 }}>
                {[{ id: 'create', label: '✦ Create Room' }, { id: 'join', label: '→ Join Room' }].map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setError('') }} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13,
                    transition: 'all 0.18s',
                    background: tab === t.id ? C.grad : 'transparent',
                    color: tab === t.id ? '#fff' : C.dim,
                    boxShadow: tab === t.id ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Join code */}
              {tab === 'join' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: C.dim, fontSize: 11, fontFamily: "'Plus Jakarta Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                    Room Code
                  </label>
                  <Input
                    value={joinCode}
                    placeholder="study-xxxxx-xxxxx"
                    onChange={e => { setJoinCode(e.target.value); setError('') }}
                    mono
                  />
                </div>
              )}

              {error && (
                <p style={{ color: '#f87171', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚠ {error}
                </p>
              )}

              <GradBtn onClick={proceed} style={{ width: '100%', padding: '15px 24px', fontSize: 16 }}>
                Continue →
              </GradBtn>
            </>
          ) : (
            <>
              {/* Back */}
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                ← Back
              </button>

              {/* Avatar preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                {/* Gradient ring */}
                <div style={{ background: C.grad, padding: 2.5, borderRadius: '50%', marginBottom: 12, boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
                  <div style={{ background: C.card, borderRadius: '50%', padding: 3 }}>
                    <AvatarPreview size={80} />
                  </div>
                </div>
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: C.text }}>{name}</p>
                <p style={{ color: C.dim, fontSize: 13, marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>This is how others will see you</p>
              </div>

              {/* Preset grid */}
              <p style={{ color: C.dim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Choose an avatar
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
                {PRESET_AVATARS.map(a => {
                  const isSelected = selectedAvatar?.value === a.id
                  return (
                    <button key={a.id} onClick={() => setSelectedAvatar({ type: 'preset', value: a.id })} style={{
                      aspectRatio: '1', background: a.bg, borderRadius: 14, border: isSelected ? '2.5px solid #fff' : '2.5px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      cursor: 'pointer', transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.15s, border 0.15s',
                      boxShadow: isSelected ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
                    }}>
                      {a.emoji}
                    </button>
                  )
                })}
              </div>

              {/* Upload */}
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '12px', borderRadius: 14, border: `1.5px dashed ${C.border}`,
                background: 'transparent', color: C.dim, cursor: 'pointer', fontSize: 14,
                fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 20, transition: 'border-color 0.2s, color 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.violet; e.currentTarget.style.color = C.text }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}>
                📷 Upload your own photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />

              {error && (
                <p style={{ color: '#f87171', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>
                  ⚠ {error}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setSelectedAvatar(null); proceedToLobby() }} style={{
                  flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${C.border}`,
                  background: 'transparent', color: C.dim, cursor: 'pointer', fontSize: 14,
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, transition: 'color 0.15s, border-color 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.muted }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = C.border }}>
                  Skip
                </button>
                <GradBtn onClick={proceedToLobby} style={{ flex: 2, padding: '14px 20px', fontSize: 15 }}>
                  Continue →
                </GradBtn>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: C.muted, fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif", marginTop: 20 }}>
          No account needed · Up to 15 people · Free forever
        </p>
      </div>
    </div>
  )
}