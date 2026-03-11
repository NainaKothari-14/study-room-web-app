import { useState, useRef, useCallback, useEffect } from 'react'

export function useMediaDevices() {
  const [localStream, setLocalStream] = useState(null)
  const [error, setError] = useState(null)
  const streamRef = useRef(null)        // always the current camera+mic stream
  const screenStreamRef = useRef(null)  // current screen stream if any

  const getMedia = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      streamRef.current = stream
      setLocalStream(stream)
      setError(null)
      return stream
    } catch (err) {
      setError(err.message)
      console.error('Media access error:', err)
      return null
    }
  }, [])

  // ── Mic: enable/disable audio tracks on the CURRENT stream ref ───────────────
  // Must read streamRef each time — stream ref can change after cam restarts
  const toggleMic = useCallback((enabled) => {
    const tracks = streamRef.current?.getAudioTracks() || []
    if (tracks.length === 0) {
      console.warn('[Mic] no audio tracks found to toggle')
      return
    }
    tracks.forEach(t => {
      t.enabled = enabled
      console.log(`[Mic] track "${t.label}" enabled=${t.enabled}`)
    })
  }, [])

  // ── Cam OFF: stop the video track so the camera light turns off ───────────────
  // ── Cam ON:  request a fresh video track and splice it into the stream ─────────
  const toggleCam = useCallback(async (enabled) => {
    const stream = streamRef.current
    if (!stream) return

    if (!enabled) {
      // Stop (not just disable) so the camera indicator light turns off
      stream.getVideoTracks().forEach(t => { t.stop(); stream.removeTrack(t) })
      // Return the updated stream so callers can replaceVideoTrack
      return stream
    } else {
      // Get a brand-new video track from the camera
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        const newVideoTrack = newStream.getVideoTracks()[0]
        if (!newVideoTrack) return stream

        // Remove any dead video tracks first
        stream.getVideoTracks().forEach(t => { t.stop(); stream.removeTrack(t) })
        // Splice in the fresh track
        stream.addTrack(newVideoTrack)
        // Force re-render by creating a new MediaStream reference
        const refreshed = new MediaStream(stream.getTracks())
        streamRef.current = refreshed
        setLocalStream(refreshed)
        return refreshed
      } catch (err) {
        console.error('Could not restart camera:', err)
        setError(err.message)
        return stream
      }
    }
  }, [])

  // ── Screen share ──────────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      })
      screenStreamRef.current = stream
      return stream
    } catch (err) {
      console.error('Screen share error:', err)
      return null
    }
  }, [])

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
  }, [])

  const stopAll = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    screenStreamRef.current = null
    setLocalStream(null)
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return {
    localStream,
    error,
    getMedia,
    toggleMic,
    toggleCam,   // now async — returns updated stream
    startScreenShare,
    stopScreenShare,
    stopAll,
  }
}