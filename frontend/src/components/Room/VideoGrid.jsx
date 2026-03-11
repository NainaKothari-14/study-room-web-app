import { useRef, useEffect } from 'react'
import VideoTile from './VideoTile'
import { getInitial, getNameGradient, PRESET_AVATARS } from '../../utils/Avatarutils'

// ── Small avatar for PiP overlay ─────────────────────────────────────────────
function AvatarPip({ name, avatar, size = 56 }) {
  if (avatar?.type === 'upload' && avatar.value) {
    return <img src={avatar.value} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  if (avatar?.type === 'preset' && avatar.value) {
    const p = PRESET_AVATARS.find(a => a.id === avatar.value)
    if (p) return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.46 }}>
        {p.emoji}
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: getNameGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: size * 0.4, color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
        {getInitial(name)}
      </span>
    </div>
  )
}

// ── Screen share tile: big presenter view with face PiP ──────────────────────
function ScreenShareTile({ stream, presenterName, presenterAvatar, presenterCamStream, presenterIsCamOn }) {
  const videoRef    = useRef(null)
  const pipVideoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (stream) {
      // Force a full rebind — set to null first, then reassign
      videoRef.current.srcObject = null
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    if (pipVideoRef.current && presenterCamStream && presenterIsCamOn) {
      pipVideoRef.current.srcObject = presenterCamStream
      pipVideoRef.current.play().catch(() => {})
    }
  }, [presenterCamStream, presenterIsCamOn])

  return (
    <div style={{ flex: 1, position: 'relative', background: '#0d0d14', borderRadius: 16, overflow: 'hidden', border: '1px solid #252530', minHeight: 0 }}>
      {/* Main screen content */}
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }} />

      {/* Presenter label */}
      <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(124,58,237,0.85)', borderRadius: 10, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 7, backdropFilter: 'blur(8px)' }}>
        <span style={{ fontSize: 14 }}>🖥️</span>
        <span style={{ color: '#fff', fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600 }}>
          {presenterName} is presenting
        </span>
      </div>

      {/* Face PiP — camera on: live video, camera off: avatar */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, width: 120, height: 90, borderRadius: 14, overflow: 'hidden', border: '2.5px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', background: '#18181f' }}>
        {presenterIsCamOn && presenterCamStream ? (
          <video ref={pipVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'linear-gradient(160deg,#1a1a24,#0f0f16)' }}>
            <AvatarPip name={presenterName} avatar={presenterAvatar} size={44} />
            <span style={{ color: '#55556a', fontSize: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cam off</span>
          </div>
        )}
        {/* Name tag on PiP */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '3px 6px', textAlign: 'center' }}>
          <span style={{ color: '#fff', fontSize: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{presenterName}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main VideoGrid ────────────────────────────────────────────────────────────
export default function VideoGrid({
  localStream, remoteStreams, localUser,
  isCamOn, isMicOn, isScreenSharing,
  screenSharerId,
}) {
  const remoteEntries = Object.entries(remoteStreams || {})

  // ── SCREEN SHARE LAYOUT ──────────────────────────────────────────────────────
  if (screenSharerId) {
    const isLocalSharing = screenSharerId === localUser?.id
    const sharerInfo     = isLocalSharing ? null : remoteStreams[screenSharerId]
    const presenterName  = isLocalSharing ? (localUser?.name || 'You') : (sharerInfo?.name || 'Presenter')
    const presenterAvatar = isLocalSharing ? localUser?.avatar : sharerInfo?.avatar

    // The actual screen stream to show in the big tile
    // For local sharer: localStream IS the screen (activeStream was swapped)
    // For remote viewer: sharerInfo.stream contains the screen track
    const screenStream = isLocalSharing ? localStream : sharerInfo?.stream

    // Presenter's camera — for local we need the camera stream separately
    // We store it in localUser.camStream when screen sharing (set in StudyRoom)
    const presenterCamStream = isLocalSharing
      ? localUser?.camStreamDuringShare
      : null // remote presenter's cam isn't separately streamed (show avatar)

    const presenterIsCamOn = isLocalSharing ? isCamOn : false

    // Participants to show in sidebar (everyone except sharer)
    const sidebarTiles = [
      // Local user tile (unless they're the sharer)
      ...(!isLocalSharing ? [{ id: '__local__', stream: localStream, name: localUser?.name || 'You', avatar: localUser?.avatar, isCamOn, isMicOn, isLocal: true }] : []),
      // Remote users (except the sharer)
      ...remoteEntries
        .filter(([pid]) => pid !== screenSharerId)
        .map(([pid, info]) => ({ id: pid, stream: info.stream, name: info.name || pid.slice(0,8), avatar: info.avatar, isCamOn: info.isCamOn, isMicOn: info.isMicOn, isLocal: false })),
    ]

    return (
      <div style={{ flex: 1, display: 'flex', gap: 10, padding: 12, overflow: 'hidden', minHeight: 0 }}>
        {/* Big presenter screen */}
        <ScreenShareTile
          stream={screenStream}
          presenterName={presenterName}
          presenterAvatar={presenterAvatar}
          presenterCamStream={presenterCamStream}
          presenterIsCamOn={presenterIsCamOn}
        />

        {/* Sidebar strip — other participants */}
        {sidebarTiles.length > 0 && (
          <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flexShrink: 0 }}>
            {sidebarTiles.map(t => (
              <div key={t.id} style={{ flexShrink: 0 }}>
                <VideoTile
                  stream={t.stream}
                  name={t.name}
                  avatar={t.avatar}
                  isLocal={t.isLocal}
                  isCamOn={t.isCamOn}
                  isMicOn={t.isMicOn}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── NORMAL GRID LAYOUT ───────────────────────────────────────────────────────
  const total = 1 + remoteEntries.length
  const cols  = total === 1 ? 1 : total === 2 ? 2 : total <= 4 ? 2 : total <= 9 ? 3 : 4

  return (
    <div style={{
      flex: 1, display: 'grid', gap: 10, padding: 12, overflow: 'auto',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      alignContent: 'start',
    }}>
      <VideoTile
        stream={localStream}
        name={localUser?.name || 'You'}
        avatar={localUser?.avatar}
        isLocal
        isCamOn={isCamOn}
        isMicOn={isMicOn}
      />
      {remoteEntries.map(([pid, info]) => (
        <VideoTile
          key={pid}
          stream={info.stream}
          name={info.name || pid.slice(0,8)}
          avatar={info.avatar}
          isLocal={false}
          isCamOn={info.isCamOn}
          isMicOn={info.isMicOn}
        />
      ))}
    </div>
  )
}