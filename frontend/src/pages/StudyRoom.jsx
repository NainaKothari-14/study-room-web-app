import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoomContext } from '../context/RoomContext'
import { useSocketContext } from '../context/SocketContext'
import { useSocket } from '../hooks/useSocket'
import { useMediaDevices } from '../hooks/useMediaDevices'
import { useWebRTC } from '../hooks/useWebRTC'
import VideoGrid from '../components/Room/VideoGrid'
import ControlBar from '../components/Room/ControlBar'
import ParticipantList from '../components/Room/ParticipantList'
import ChatPanel from '../components/Chat/ChatPanel'
import FilePanel from '../components/Files/FilePanel'
import EmojiReactions from '../components/Reactions/Emojireactions '
import { getRoomUrl } from '../utils/roomUtils'

export default function StudyRoom() {
  const { roomId } = useParams()
  const navigate   = useNavigate()
  const { socket } = useSocketContext()
  const {
    localUser, isMicOn, isCamOn,
    setIsMicOn, setIsCamOn,
    isScreenSharing, setIsScreenSharing,
    reactions,
  } = useRoomContext()
  const { joinRoom, leaveRoom, sendMessage, sendReaction, shareFile } = useSocket()
  const {
    localStream, getMedia,
    toggleMic, toggleCam,
    startScreenShare, stopScreenShare, stopAll,
  } = useMediaDevices()

  const [activeStream,   setActiveStream]   = useState(null)
  const [activePanel,    setActivePanel]    = useState('chat')
  const [copied,         setCopied]         = useState(false)
  const [screenSharerId, setScreenSharerId] = useState(null)

  const { remoteStreams, replaceVideoTrack } = useWebRTC(roomId, localUser?.id, activeStream, localUser)

  // ── Boot: get camera first, then join ────────────────────────────────────────
  useEffect(() => {
    if (!localUser) { navigate('/'); return }
    const wantCam = localUser.startCam !== false
    const wantMic = localUser.startMic !== false
    // Sync initial mic/cam state from lobby prefs
    setIsCamOn(wantCam)
    setIsMicOn(wantMic)
    // Always request BOTH tracks — we need senders to exist on every peer
    // connection so replaceTrack works for screen share later.
    // We just disable/stop tracks after based on lobby prefs.
    getMedia(true, true).then((stream) => {
      if (stream) {
        if (!wantMic) stream.getAudioTracks().forEach(t => { t.enabled = false })
        if (!wantCam) stream.getVideoTracks().forEach(t => { t.stop() })
        setActiveStream(stream)
      }
      joinRoom(roomId, localUser)
    })
    return () => { leaveRoom(roomId, localUser?.id); stopAll() }
  }, []) // eslint-disable-line

  // ── Listen for screen share from other users ──────────────────────────────────
  useEffect(() => {
    if (!socket) return
    const handler = ({ userId, sharing }) => setScreenSharerId(sharing ? userId : null)
    socket.on('room:screenshare', handler)
    return () => socket.off('room:screenshare', handler)
  }, [socket])

  // ── Controls ──────────────────────────────────────────────────────────────────
  const handleToggleMic = () => {
    const next = !isMicOn
    setIsMicOn(next)
    toggleMic(next)
    socket?.emit('mic:state', { roomId, from: localUser?.id, isMicOn: next, name: localUser?.name, avatar: localUser?.avatar })
  }

  const handleToggleCam = async () => {
    const next = !isCamOn
    setIsCamOn(next)
    const updated = await toggleCam(next)
    if (updated) { setActiveStream(updated); replaceVideoTrack(updated) }
    socket?.emit('cam:state', { roomId, from: localUser?.id, isCamOn: next, name: localUser?.name, avatar: localUser?.avatar })
  }

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      // ── Stop ────────────────────────────────────────────────────────────────
      stopScreenShare()
      setIsScreenSharing(false)
      setScreenSharerId(null)
      setActiveStream(localStream)
      replaceVideoTrack(localStream)        // push camera back to all peers
      socket?.emit('room:screenshare', { roomId, userId: localUser?.id, sharing: false })
    } else {
      // ── Start ───────────────────────────────────────────────────────────────
      if (screenSharerId && screenSharerId !== localUser?.id) {
        return alert('Someone else is sharing their screen.')
      }
      const ss = await startScreenShare()
      if (!ss) return

      // Handle browser "Stop sharing" button
      ss.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopScreenShare()
        setIsScreenSharing(false)
        setScreenSharerId(null)
        setActiveStream(localStream)
        replaceVideoTrack(localStream)
        socket?.emit('room:screenshare', { roomId, userId: localUser?.id, sharing: false })
      })

      setIsScreenSharing(true)
      setScreenSharerId(localUser?.id)
      setActiveStream(ss)
      replaceVideoTrack(ss)                 // push screen track to all peers
      socket?.emit('room:screenshare', { roomId, userId: localUser?.id, sharing: true })
    }
  }

  const handleLeave = () => { leaveRoom(roomId, localUser?.id); stopAll(); navigate('/') }

  const copyLink = () => {
    navigator.clipboard.writeText(getRoomUrl(roomId))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const isSomeoneElseSharing = screenSharerId && screenSharerId !== localUser?.id

  return (
    <div style={{ height: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #252530', background: '#111118', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#f0f0f8', fontSize: 18 }}>StudySync</span>
          <div style={{ width: 1, height: 16, background: '#252530' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#55556a', fontSize: 12 }}>{roomId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSomeoneElseSharing && (
            <span style={{ color: '#a78bfa', fontSize: 12, background: 'rgba(124,58,237,0.1)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(124,58,237,0.2)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              🖥️ Screen being shared
            </span>
          )}
          <button onClick={copyLink} style={{ background: '#18181f', border: '1px solid #252530', color: '#8888a8', cursor: 'pointer', fontSize: 13, padding: '6px 14px', borderRadius: 10, fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.15s' }}>
            {copied ? '✅ Copied!' : '🔗 Invite'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <VideoGrid
            localStream={activeStream}
            remoteStreams={remoteStreams}
            localUser={localUser}
            isCamOn={isCamOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            screenSharerId={screenSharerId}
          />
          <ControlBar
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            isScreenSharing={isScreenSharing}
            canShare={!isSomeoneElseSharing}
            onToggleMic={handleToggleMic}
            onToggleCam={handleToggleCam}
            onScreenShare={handleScreenShare}
            onLeave={handleLeave}
            onReact={emoji => sendReaction(roomId, emoji, localUser?.name)}
            onPanelChange={setActivePanel}
            activePanel={activePanel}
          />
        </div>

        {/* Side panel */}
        <div style={{ width: 320, borderLeft: '1px solid #252530', background: '#111118', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          {activePanel === 'chat'         && <ChatPanel roomId={roomId} localUser={localUser} onSend={sendMessage} />}
          {activePanel === 'participants' && <ParticipantList />}
          {activePanel === 'files'        && <FilePanel roomId={roomId} localUser={localUser} onShare={shareFile} />}
        </div>
      </div>

      <EmojiReactions reactions={reactions} />
    </div>
  )
}