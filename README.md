<div align="center">

<img src="https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge" alt="Status" />

# 📚 StudySync

**Virtual study rooms for focused minds — no sign up, no downloads, just focus.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![WebRTC](https://img.shields.io/badge/WebRTC-Native-333?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [Roadmap](#-roadmap)

</div>

---

## ✨ Features

- 🎥 **Multi-user video & audio** — real-time peer-to-peer calls for up to 15 participants
- 🖥️ **Screen sharing** — share your screen with a Google Meet-style presenter layout; your face/avatar appears as a PiP in the corner
- 🎭 **Avatar system** — choose a preset emoji avatar, upload a photo, or use your initial with a generated gradient
- 🚪 **Pre-join lobby** — configure your camera and microphone before entering, just like Zoom
- 💬 **Real-time chat** — send messages to everyone in the room instantly
- 😄 **Emoji reactions** — float animated reactions across the screen
- 📎 **File sharing** — share files with everyone in the room
- 👥 **Participant list** — see who's in the room with their avatars and mic/cam status
- 🔗 **Instant room creation** — create or join rooms with a shareable code, no account needed

---

## 🛠 Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| [React 18](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [React Router](https://reactrouter.com) | Client-side routing |
| [Socket.io Client](https://socket.io) | Real-time signaling & events |
| Native WebRTC | Peer-to-peer video/audio/screen |

### Backend
| Tech | Purpose |
|------|---------|
| [Node.js](https://nodejs.org) | Runtime |
| [Express](https://expressjs.com) | HTTP server |
| [Socket.io](https://socket.io) | WebRTC signaling relay & room events |

### Architecture
```
Browser A                    Server                    Browser B
   │                     (Signal relay)                    │
   │──── socket: offer ──────────►│──── socket: offer ────►│
   │◄─── socket: answer ──────────│◄─── socket: answer ────│
   │──── socket: ice ─────────────►│──── socket: ice ──────►│
   │                               │                        │
   │◄═══════════════ WebRTC P2P video/audio ═══════════════►│
```

The server never handles media — it only relays WebRTC signaling (SDP offers/answers and ICE candidates) via Socket.io. All video and audio flows directly peer-to-peer.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A modern browser (Chrome, Firefox, Edge)
- Camera and microphone (for video/audio features)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/NainaKothari-14/study-room-web-app.git
cd study-room-web-app
```

**2. Start the backend**
```bash
cd backend
npm install
cp .env.example .env   # set PORT and CLIENT_URL
npm run dev
```

**3. Start the frontend**
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_SERVER_URL
npm run dev
```

**4. Open your browser**

Go to `http://localhost:5173`, create a room, copy the invite link, and share it with a friend.

### Environment Variables

**Backend** (`.env`)
```
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Frontend** (`.env`)
```
VITE_SERVER_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
study-room-web-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Room/
│   │   │   │   ├── VideoGrid.jsx       # Grid layout + screen share presenter view
│   │   │   │   ├── VideoTile.jsx       # Single participant tile with avatar fallback
│   │   │   │   ├── ControlBar.jsx      # Mic, cam, screen share, reactions, leave
│   │   │   │   └── ParticipantList.jsx # Sidebar participant list
│   │   │   ├── Chat/                   # Chat panel, messages & input
│   │   │   ├── Files/                  # File sharing panel
│   │   │   └── Reactions/              # Floating emoji reactions
│   │   ├── context/
│   │   │   ├── RoomContext.jsx         # Room-wide shared state
│   │   │   └── SocketContext.jsx       # Singleton socket connection
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js            # RTCPeerConnection lifecycle & signaling
│   │   │   ├── useMediaDevices.js      # Camera, mic, screen capture
│   │   │   └── useSocket.js            # Chat, reactions, file socket events
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx         # Name → Avatar → Lobby → Room
│   │   │   └── StudyRoom.jsx           # Main room view
│   │   └── utils/
│   │       ├── roomUtils.js            # ID generation, helpers
│   │       └── avatarUtils.js          # Avatar presets + gradient generation
│   └── index.html
│
└── backend/
    ├── server.js
    └── src/
        ├── socket/
        │   ├── roomHandlers.js         # Join/leave, WebRTC relay, state sync
        │   ├── chatHandlers.js
        │   └── reactionHandlers.js
        └── routes/
```

---

## 🗺 Roadmap

> This project is actively being built. Here's what's planned:

- [x] Multi-user WebRTC video & audio
- [x] Screen sharing with Google Meet-style presenter layout
- [x] PiP face/avatar overlay during screen share
- [x] Pre-join lobby with camera/mic preview
- [x] Avatar system (preset emoji, upload, or initial)
- [x] Real-time chat
- [x] Emoji reactions
- [x] File sharing
- [x] Participant list with mic/cam status indicators
- [ ] UI polish & theming
- [ ] Mobile responsive layout
- [ ] Raise hand feature
- [ ] Persistent chat history
- [ ] Shared whiteboard / notes
- [ ] Background blur / virtual backgrounds
- [ ] Local recording
- [ ] TURN server support for better connectivity across networks

---

## 🤝 Contributing

This is a solo project currently in active development. Issues and feature suggestions are very welcome — feel free to open one to start a conversation.

---

## 📄 License

MIT © [Naina Kothari](https://github.com/NainaKothari-14)

---

<div align="center">
  <sub>Built with ❤️ for people who study better together</sub>
</div>
