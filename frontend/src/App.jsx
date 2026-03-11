import { Routes, Route } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import { RoomProvider } from './context/RoomContext'
import LandingPage from './pages/LandingPage'
import StudyRoom from './pages/StudyRoom'

export default function App() {
  return (
    <SocketProvider>
      <RoomProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomId" element={<StudyRoom />} />
        </Routes>
      </RoomProvider>
    </SocketProvider>
  )
}