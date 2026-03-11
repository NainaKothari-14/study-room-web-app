import { useRoomContext } from '../../context/RoomContext'
import { getInitials } from '../../utils/roomUtils'

export default function ParticipantList() {
    const { participants, localUser } = useRoomContext()

    const all = localUser
        ? [{ ...localUser, isLocal: true }, ...participants.filter(p => p.id !== localUser.id)]
        : participants

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-study-border">
                <h3 className="font-display font-semibold text-study-text">
                    Participants <span className="text-study-muted font-body font-normal text-sm">({all.length})</span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {all.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-study-card transition-colors">
                        <div className="w-9 h-9 rounded-full bg-study-accent flex items-center justify-center text-white font-display font-semibold text-sm flex-shrink-0">
                            {getInitials(p.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-study-text font-body text-sm truncate">
                                {p.name} {p.isLocal && <span className="text-study-muted text-xs">(You)</span>}
                            </p>
                        </div>
                        <div className="flex gap-1">
                            <span title="Mic">{p.isMicOn === false ? '🔇' : '🎤'}</span>
                            <span title="Cam">{p.isCamOn === false ? '🚫' : '📷'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}