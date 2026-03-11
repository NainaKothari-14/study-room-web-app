import { createContext, useContext, useState, useCallback } from 'react'

const RoomContext = createContext(null)

export function RoomProvider({ children }) {
  const [roomId, setRoomId] = useState(null)
  const [participants, setParticipants] = useState([])
  const [localUser, setLocalUser] = useState(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [reactions, setReactions] = useState([])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const addReaction = useCallback((reaction) => {
    const id = Date.now()
    setReactions(prev => [...prev, { ...reaction, id }])
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id))
    }, 2000)
  }, [])

  const addFile = useCallback((file) => {
    setFiles(prev => [...prev, file])
  }, [])

  const updateParticipants = useCallback((list) => {
    setParticipants(list)
  }, [])

  return (
    <RoomContext.Provider value={{
      roomId, setRoomId,
      participants, updateParticipants,
      localUser, setLocalUser,
      isMicOn, setIsMicOn,
      isCamOn, setIsCamOn,
      isScreenSharing, setIsScreenSharing,
      messages, addMessage,
      files, addFile,
      reactions, addReaction,
    }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoomContext() {
  return useContext(RoomContext)
}