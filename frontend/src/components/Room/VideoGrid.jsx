import VideoTile from './VideoTile'

export default function VideoGrid({ localStream, remoteStreams, localUser, isCamOn, isMicOn, isScreenSharing }) {
  const remoteEntries = Object.entries(remoteStreams || {})
  const total = 1 + remoteEntries.length

  const gridClass =
    total === 1 ? 'grid-cols-1' :
    total === 2 ? 'grid-cols-2' :
    total <= 4  ? 'grid-cols-2' :
    total <= 9  ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className={`flex-1 grid ${gridClass} gap-2 p-3 overflow-auto bg-s-bg`}>
      <VideoTile
        stream={localStream}
        name={localUser?.name || 'You'}
        avatar={localUser?.avatar}
        isLocal
        isCamOn={isScreenSharing ? true : isCamOn}
        isMicOn={isMicOn}
      />
      {remoteEntries.map(([peerId, info]) => (
        <VideoTile
          key={peerId}
          stream={info.stream}
          name={info.name || peerId.substring(0, 8)}
          avatar={info.avatar}
          isLocal={false}
          isCamOn={info.isCamOn}
          isMicOn={info.isMicOn}
        />
      ))}
    </div>
  )
}