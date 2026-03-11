import { useState, useRef, useCallback, useEffect } from 'react'
import { useSocketContext } from '../context/SocketContext'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRTC(roomId, userId, activeStream, localUser) {
  const { socket } = useSocketContext()

  // All mutable values in refs — closures never go stale
  const socketRef       = useRef(null)
  const roomIdRef       = useRef(roomId)
  const userIdRef       = useRef(userId)
  const activeStreamRef = useRef(activeStream)
  const localUserRef    = useRef(localUser)
  const pcsRef          = useRef({})  // { remoteUserId: RTCPeerConnection }

  // remoteStreams: { userId: { stream: MediaStream, name: string, isCamOn: bool } }
  const [remoteStreams, setRemoteStreams] = useState({})

  // Update refs every render — no stale closures ever
  socketRef.current       = socket
  roomIdRef.current       = roomId
  userIdRef.current       = userId
  activeStreamRef.current = activeStream
  localUserRef.current    = localUser

  // ── helpers ───────────────────────────────────────────────────────────────────

  const upsertRemote = useCallback((uid, patch) => {
    setRemoteStreams(prev => ({
      ...prev,
      [uid]: { isCamOn: true, name: uid, ...prev[uid], ...patch },
    }))
  }, [])

  const removeRemote = useCallback((uid) => {
    setRemoteStreams(prev => {
      const next = { ...prev }
      delete next[uid]
      return next
    })
  }, [])

  // ── create RTCPeerConnection ──────────────────────────────────────────────────

  const createPC = useCallback((remoteUserId) => {
    pcsRef.current[remoteUserId]?.close()

    const pc = new RTCPeerConnection(ICE_SERVERS)
    const remoteStream = new MediaStream()

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return
      socketRef.current?.emit('webrtc:ice', {
        roomId: roomIdRef.current,
        to: remoteUserId,
        from: userIdRef.current,
        candidate,
      })
    }

    pc.ontrack = ({ track }) => {
      const old = remoteStream.getTracks().find(t => t.kind === track.kind)
      if (old) remoteStream.removeTrack(old)
      remoteStream.addTrack(track)
      upsertRemote(remoteUserId, { stream: new MediaStream(remoteStream.getTracks()) })
    }

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] ${remoteUserId}: ${pc.connectionState}`)
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        removeRemote(remoteUserId)
        delete pcsRef.current[remoteUserId]
      }
    }

    const stream = activeStreamRef.current
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log(`[WebRTC] adding ${track.kind} track for ${remoteUserId}`)
        pc.addTrack(track, stream)
      })
    } else {
      console.warn('[WebRTC] no activeStream when createPC called for', remoteUserId)
    }

    pcsRef.current[remoteUserId] = pc
    return pc
  }, [upsertRemote, removeRemote])

  // ── send offer ────────────────────────────────────────────────────────────────

  const callPeer = useCallback(async (remoteUserId) => {
    console.log('[WebRTC] calling:', remoteUserId)
    const pc = createPC(remoteUserId)
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
      await pc.setLocalDescription(offer)
      socketRef.current?.emit('webrtc:offer', {
        roomId: roomIdRef.current,
        to: remoteUserId,
        from: userIdRef.current,
        sdp: pc.localDescription,
        name: localUserRef.current?.name,
        avatar: localUserRef.current?.avatar,
      })
    } catch (err) {
      console.error('[WebRTC] createOffer:', err)
    }
  }, [createPC])

  // ── replace video track on all PCs (screen share / cam restart) ───────────────

  const replaceVideoTrack = useCallback((stream) => {
    const videoTrack = stream?.getVideoTracks()[0]
    Object.values(pcsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video')
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack).catch(e => console.error('[WebRTC] replaceTrack:', e))
      }
    })
  }, [])

  // ── socket listeners — registered once when socket is ready ──────────────────

  useEffect(() => {
    if (!socket) return

    const onPeerJoined = ({ peerId, name, avatar }) => {
      if (peerId === userIdRef.current) return
      console.log('[WebRTC] peer:joined →', peerId)
      upsertRemote(peerId, { name: name || peerId.substring(0, 8), avatar: avatar || null })
      callPeer(peerId)
    }

    const onOffer = async ({ from, sdp, name, avatar }) => {
      console.log('[WebRTC] offer from:', from)
      upsertRemote(from, { name: name || from.substring(0, 8), avatar: avatar || null })
      let pc = pcsRef.current[from]
      if (!pc) pc = createPC(from)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socketRef.current?.emit('webrtc:answer', {
          roomId: roomIdRef.current,
          to: from,
          from: userIdRef.current,
          sdp: pc.localDescription,
          name: localUserRef.current?.name,
          avatar: localUserRef.current?.avatar,
        })
      } catch (err) {
        console.error('[WebRTC] answer:', err)
      }
    }

    const onAnswer = async ({ from, sdp, name, avatar }) => {
      const pc = pcsRef.current[from]
      if (!pc) return
      // Store name+avatar now that we know who answered
      upsertRemote(from, {
        name: name || from.substring(0, 8),
        avatar: avatar || null,
      })
      try {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        }
      } catch (err) {
        console.error('[WebRTC] setRemoteDesc(answer):', err)
      }
    }

    const onIce = async ({ from, candidate }) => {
      const pc = pcsRef.current[from]
      if (!pc || !candidate) return
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch (_) {}
    }

    const onPeerLeft = ({ peerId }) => {
      console.log('[WebRTC] peer:left →', peerId)
      pcsRef.current[peerId]?.close()
      delete pcsRef.current[peerId]
      removeRemote(peerId)
    }

    const onCamState = ({ from, isCamOn, name, avatar }) => {
      upsertRemote(from, { isCamOn, ...(name && { name }), ...(avatar && { avatar }) })
    }

    const onMicState = ({ from, isMicOn, name, avatar }) => {
      upsertRemote(from, { isMicOn, ...(name && { name }), ...(avatar && { avatar }) })
    }

    socket.on('peer:joined',   onPeerJoined)
    socket.on('webrtc:offer',  onOffer)
    socket.on('webrtc:answer', onAnswer)
    socket.on('webrtc:ice',    onIce)
    socket.on('peer:left',     onPeerLeft)
    socket.on('cam:state',     onCamState)
    socket.on('mic:state',     onMicState)

    return () => {
      socket.off('peer:joined',   onPeerJoined)
      socket.off('webrtc:offer',  onOffer)
      socket.off('webrtc:answer', onAnswer)
      socket.off('webrtc:ice',    onIce)
      socket.off('peer:left',     onPeerLeft)
      socket.off('cam:state',     onCamState)
      socket.off('mic:state',     onMicState)
    }
  }, [socket, callPeer, createPC, upsertRemote, removeRemote])

  // ── cleanup ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      Object.values(pcsRef.current).forEach(pc => pc.close())
      pcsRef.current = {}
    }
  }, [])

  return { remoteStreams, replaceVideoTrack }
}