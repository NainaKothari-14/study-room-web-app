import { useEffect, useCallback } from 'react'
import { useSocketContext } from '../context/SocketContext'
import { useRoomContext } from '../context/RoomContext'

export function useSocket() {
  const { socket } = useSocketContext()
  const { addMessage, addReaction, updateParticipants, addFile } = useRoomContext()

  useEffect(() => {
    if (!socket) return

    socket.on('chat:message', (msg) => addMessage(msg))
    socket.on('room:reaction', (reaction) => addReaction(reaction))
    socket.on('room:participants', (list) => updateParticipants(list))
    socket.on('room:file-shared', (file) => addFile(file))

    return () => {
      socket.off('chat:message')
      socket.off('room:reaction')
      socket.off('room:participants')
      socket.off('room:file-shared')
    }
  }, [socket, addMessage, addReaction, updateParticipants, addFile])

  const joinRoom = useCallback((roomId, user) => {
    socket?.emit('room:join', { roomId, user })
  }, [socket])

  const leaveRoom = useCallback((roomId, userId) => {
    socket?.emit('room:leave', { roomId, userId })
  }, [socket])

  const sendMessage = useCallback((roomId, message) => {
    socket?.emit('chat:send', { roomId, message })
  }, [socket])

  const sendReaction = useCallback((roomId, emoji, userName) => {
    socket?.emit('room:react', { roomId, emoji, userName })
  }, [socket])

  const shareFile = useCallback((roomId, fileInfo) => {
    socket?.emit('room:share-file', { roomId, fileInfo })
  }, [socket])

  return { joinRoom, leaveRoom, sendMessage, sendReaction, shareFile }
}