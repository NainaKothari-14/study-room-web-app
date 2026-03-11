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

  const socketRef       = useRef(null)
  const roomIdRef       = useRef(roomId)
  const userIdRef       = useRef(userId)
  const activeStreamRef = useRef(activeStream)
  const localUserRef    = useRef(localUser)
  const pcsRef          = useRef({})
  // Store each peer's incoming MediaStream so we can update it on renegotiation
  const incomingStreamsRef = useRef({})

  const [remoteStreams, setRemoteStreams] = useState({})

  socketRef.current       = socket
  roomIdRef.current       = roomId
  userIdRef.current       = userId
  activeStreamRef.current = activeStream
  localUserRef.current    = localUser

  const upsertRemote = useCallback((uid, patch) => {
    setRemoteStreams(prev => ({
      ...prev,
      [uid]: { isCamOn: true, isMicOn: true, name: uid, ...prev[uid], ...patch },
    }))
  }, [])

  const removeRemote = useCallback((uid) => {
    setRemoteStreams(prev => {
      const next = { ...prev }
      delete next[uid]
      return next
    })
  }, [])

  const createPC = useCallback((peerId) => {
    pcsRef.current[peerId]?.close()

    const pc = new RTCPeerConnection(ICE_SERVERS)
    const incomingStream = new MediaStream()
    incomingStreamsRef.current[peerId] = incomingStream

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return
      socketRef.current?.emit('webrtc:ice', {
        roomId: roomIdRef.current,
        to: peerId,
        from: userIdRef.current,
        candidate,
      })
    }

    pc.ontrack = ({ track }) => {
      console.log(`[WebRTC] ontrack from ${peerId}: ${track.kind}`)
      // Remove any old track of same kind
      incomingStream.getTracks()
        .filter(t => t.kind === track.kind)
        .forEach(t => incomingStream.removeTrack(t))
      incomingStream.addTrack(track)
      // New reference forces React + video element to update
      upsertRemote(peerId, { stream: new MediaStream(incomingStream.getTracks()) })
    }

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] ${peerId}: ${pc.connectionState}`)
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        removeRemote(peerId)
        delete pcsRef.current[peerId]
        delete incomingStreamsRef.current[peerId]
      }
    }

    const stream = activeStreamRef.current
    if (stream) {
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
    }

    pcsRef.current[peerId] = pc
    return pc
  }, [upsertRemote, removeRemote])

  const callPeer = useCallback(async (peerId) => {
    const pc = createPC(peerId)
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
      await pc.setLocalDescription(offer)
      socketRef.current?.emit('webrtc:offer', {
        roomId: roomIdRef.current,
        to: peerId,
        from: userIdRef.current,
        sdp: pc.localDescription,
        name: localUserRef.current?.name,
        avatar: localUserRef.current?.avatar,
      })
    } catch (err) {
      console.error('[WebRTC] createOffer:', err)
    }
  }, [createPC])

  // ── THE KEY FIX ──────────────────────────────────────────────────────────────
  // replaceTrack on sender side does NOT trigger ontrack on receiver.
  // Solution: sender calls replaceTrack, then broadcasts 'webrtc:screen-refresh'
  // Receivers respond by reading the LIVE track from their RTCRtpReceiver
  // (which already has the new video data) and refreshing their MediaStream.
  const replaceVideoTrack = useCallback((stream) => {
    if (!stream) return
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return

    console.log(`[WebRTC] replaceVideoTrack: "${videoTrack.label}" on ${Object.keys(pcsRef.current).length} peer(s)`)

    Object.entries(pcsRef.current).forEach(([peerId, pc]) => {
      // Match video senders — including ones whose track was stopped (track.readyState === 'ended')
      const sender = pc.getSenders().find(s => s.track?.kind === 'video' || s.track?.readyState === 'ended')
      const doRefresh = () => {
        // Wait 400ms so bytes are flowing before receiver rebinds the video element
        setTimeout(() => {
          socketRef.current?.emit('webrtc:screen-refresh', {
            roomId: roomIdRef.current,
            from: userIdRef.current,
            to: peerId,
          })
        }, 400)
      }
      if (sender) {
        sender.replaceTrack(videoTrack)
          .then(() => { console.log(`[WebRTC] ✓ replaceTrack for ${peerId}`); doRefresh() })
          .catch(e => console.error('[WebRTC] replaceTrack error:', e))
      } else {
        // No video sender at all — add one (shouldn't happen if getMedia(true,true) was called)
        pc.addTrack(videoTrack, stream)
        doRefresh()
      }
    })
  }, [])

  useEffect(() => {
    if (!socket) return

    const onPeerJoined = ({ peerId, name, avatar }) => {
      if (peerId === userIdRef.current) return
      upsertRemote(peerId, { name: name || peerId.slice(0, 8), avatar: avatar || null })
      callPeer(peerId)
    }

    const onOffer = async ({ from, sdp, name, avatar }) => {
      upsertRemote(from, { name: name || from.slice(0, 8), avatar: avatar || null })
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
        console.error('[WebRTC] answer error:', err)
      }
    }

    const onAnswer = async ({ from, sdp, name, avatar }) => {
      const pc = pcsRef.current[from]
      if (!pc) return
      upsertRemote(from, { name: name || from.slice(0, 8), avatar: avatar || null })
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
      pcsRef.current[peerId]?.close()
      delete pcsRef.current[peerId]
      delete incomingStreamsRef.current[peerId]
      removeRemote(peerId)
    }

    // Receiver side: sharer called replaceTrack and told us to refresh.
    // Read the LIVE video track directly from our RTCRtpReceiver — it already
    // has the new screen content flowing through it, we just need to update the
    // MediaStream reference so React re-renders the <video> element.
    const onScreenRefresh = ({ from }) => {
      // replaceTrack doesn't change the track object — the same track ID
      // carries the new content. We just need to force the <video> element
      // to rebind by creating a fresh MediaStream wrapping the SAME tracks.
      const incoming = incomingStreamsRef.current[from]
      if (!incoming) return

      console.log(`[WebRTC] screen-refresh from ${from} — forcing video rebind`)

      // New MediaStream object reference → VideoTile useEffect fires → srcObject reassigned
      setRemoteStreams(prev => ({
        ...prev,
        [from]: { ...prev[from], stream: new MediaStream(incoming.getTracks()) },
      }))
    }

    const onCamState = ({ from, isCamOn, name, avatar }) => {
      upsertRemote(from, { isCamOn, ...(name && { name }), ...(avatar && { avatar }) })
    }
    const onMicState = ({ from, isMicOn, name, avatar }) => {
      upsertRemote(from, { isMicOn, ...(name && { name }), ...(avatar && { avatar }) })
    }

    socket.on('peer:joined',          onPeerJoined)
    socket.on('webrtc:offer',         onOffer)
    socket.on('webrtc:answer',        onAnswer)
    socket.on('webrtc:ice',           onIce)
    socket.on('peer:left',            onPeerLeft)
    socket.on('webrtc:screen-refresh', onScreenRefresh)
    socket.on('cam:state',            onCamState)
    socket.on('mic:state',            onMicState)

    return () => {
      socket.off('peer:joined',          onPeerJoined)
      socket.off('webrtc:offer',         onOffer)
      socket.off('webrtc:answer',        onAnswer)
      socket.off('webrtc:ice',           onIce)
      socket.off('peer:left',            onPeerLeft)
      socket.off('webrtc:screen-refresh', onScreenRefresh)
      socket.off('cam:state',            onCamState)
      socket.off('mic:state',            onMicState)
    }
  }, [socket, callPeer, createPC, upsertRemote, removeRemote])

  useEffect(() => {
    return () => {
      Object.values(pcsRef.current).forEach(pc => pc.close())
      pcsRef.current = {}
    }
  }, [])

  return { remoteStreams, replaceVideoTrack }
}