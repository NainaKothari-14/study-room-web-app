import { formatTime, getInitials } from '../../utils/roomUtils'

export default function ChatMessage({ message, isOwn }) {
    return (
        <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
            {!isOwn && (
                <div className="w-7 h-7 rounded-full bg-study-accent flex items-center justify-center text-white text-xs font-display font-bold flex-shrink-0">
                    {getInitials(message.sender)}
                </div>
            )}
            <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && (
                    <span className="text-study-muted text-xs font-body px-1">{message.sender}</span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm font-body break-words ${isOwn
                    ? 'bg-study-accent text-white rounded-br-sm'
                    : 'bg-study-card text-study-text rounded-bl-sm'
                    }`}>
                    {message.text}
                </div>
                <span className="text-study-muted text-xs font-body px-1">
                    {formatTime(message.timestamp)}
                </span>
            </div>
        </div>
    )
}