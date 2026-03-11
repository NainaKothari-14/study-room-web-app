import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

// Single socket instance shared across the whole app
let socketInstance = null

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const s = getSocket()
    setSocket(s)

    const onConnect    = () => { console.log('[Socket] connected:', s.id); setConnected(true) }
    const onDisconnect = () => { console.log('[Socket] disconnected'); setConnected(false) }

    s.on('connect',    onConnect)
    s.on('disconnect', onDisconnect)

    if (s.connected) setConnected(true)

    return () => {
      s.off('connect',    onConnect)
      s.off('disconnect', onDisconnect)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocketContext() {
  return useContext(SocketContext)
}