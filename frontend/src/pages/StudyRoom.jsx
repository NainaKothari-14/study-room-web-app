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
    localUser,
    isMicOn,  setIsMicOn,
    isCamOn,  setIsCamOn,
    isScreenSharing, setIsScreenSharing,
    reactions,
  } = useRoomContext()

  const { joinRoom, leaveRoom, sendMessage, sendReaction, shareFile } = useSocket()
  const { localStream, getMedia, toggleMic, toggleCam, startScreenShare, stopScreenShare, stopAll } = useMediaDevices()

  const [activeStream,    setActiveStream]    = useState(null)
  const [activePanel,     setActivePanel]     = useState('chat')
  const [copied,          setCopied]          = useState(false)
  const [screenSharerId,  setScreenSharerId]  = useState(null)
  const [mediaReady,      setMediaReady]      = useState(false)

  const { remoteStreams, replaceVideoTrack } = useWebRTC(roomId, localUser?.id, activeStream, localUser)

  // ── Boot ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localUser) { navigate('/'); return }
    getMedia(true, true).then(stream => {
      if (stream) { setActiveStream(stream); setMediaReady(true) }
      joinRoom(roomId, localUser)
    })
    return () => { leaveRoom(roomId, localUser?.id); stopAll() }
  }, []) // eslint-disable-line

  // ── Screen share broadcast from others ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return
    const h = ({ userId, sharing }) => setScreenSharerId(sharing ? userId : null)
    socket.on('room:screenshare', h)
    return () => socket.off('room:screenshare', h)
  }, [socket])

  // ── Controls ──────────────────────────────────────────────────────────────────
  const handleToggleMic = () => {
    const next = !isMicOn
    setIsMicOn(next)
    toggleMic(next)
    socket?.emit('mic:state', { roomId, from: localUser?.id, isMicOn: next })
  }

  const handleToggleCam = async () => {
    const next = !isCamOn
    setIsCamOn(next)
    const updated = await toggleCam(next)
    if (updated) { setActiveStream(updated); replaceVideoTrack(updated) }
    socket?.emit('cam:state', { roomId, from: localUser?.id, isCamOn: next })
  }

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare()
      setIsScreenSharing(false)
      setActiveStream(localStream)
      replaceVideoTrack(localStream)
      setScreenSharerId(null)
      socket?.emit('room:screenshare', { roomId, userId: localUser?.id, sharing: false })
    } else {
      if (screenSharerId && screenSharerId !== localUser?.id) {
        return alert('Someone else is sharing. Wait for them to stop.')
      }
      const ss = await startScreenShare()
      if (!ss) return
      ss.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopScreenShare(); setIsScreenSharing(false)
        setActiveStream(localStream); replaceVideoTrack(localStream)
        setScreenSharerId(null)
        socket?.emit('room:screenshare', { roomId, userId: localUser?.id, sharing: false })
      })
      setIsScreenSharing(true)
      setActiveStream(ss)
      replaceVideoTrack(ss)
      setScreenSharerId(localUser?.id)
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
    <div className="h-screen bg-s-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-s-border glass">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl btn-grad flex items-center justify-center text-base">📚</div>
          <span className="font-display font-bold text-s-text text-lg tracking-tight">StudySync</span>
          <div className="w-px h-4 bg-s-border" />
          <span className="font-mono text-s-muted text-xs">{roomId}</span>
        </div>

        <div className="flex items-center gap-3">
          {isSomeoneElseSharing && (
            <span className="text-violet-400 text-xs font-body bg-s-violet/10 px-3 py-1.5 rounded-full border border-s-violet/20 animate-pulse">
              🖥️ Screen being shared
            </span>
          )}
          <button onClick={copyLink}
            className="flex items-center gap-2 text-xs font-body px-4 py-2 rounded-xl bg-s-card border border-s-border hover:border-violet-500 text-s-dim hover:text-s-text transition-all">
            {copied ? '✅ Copied!' : '🔗 Invite'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <VideoGrid
            localStream={activeStream}
            remoteStreams={remoteStreams}
            localUser={localUser}
            isCamOn={isCamOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
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
        <div className="w-80 border-l border-s-border flex flex-col bg-s-surface overflow-hidden">
          {activePanel === 'chat'         && <ChatPanel roomId={roomId} localUser={localUser} onSend={sendMessage} />}
          {activePanel === 'participants' && <ParticipantList />}
          {activePanel === 'files'        && <FilePanel roomId={roomId} localUser={localUser} onShare={shareFile} />}
        </div>
      </div>

      <EmojiReactions reactions={reactions} />
    </div>
  )
}