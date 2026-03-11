import { formatTime } from '../../utils/roomUtils'

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileIcon(type) {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📑'
    return '📎'
}

export default function FileItem({ file }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-study-card rounded-xl border border-study-border hover:border-study-accent/40 transition-colors group">
            <span className="text-2xl">{fileIcon(file.type)}</span>
            <div className="flex-1 min-w-0">
                <p className="text-study-text font-body text-sm truncate">{file.name}</p>
                <p className="text-study-muted text-xs font-body">
                    {formatSize(file.size)} · {file.uploadedBy} · {formatTime(file.uploadedAt)}
                </p>
            </div>
            <a
                href={file.url}
                download={file.name}
                className="icon-btn w-8 h-8 text-study-muted group-hover:text-study-accent transition-colors opacity-0 group-hover:opacity-100"
                title="Download"
            >
                ⬇
            </a>
        </div>
    )
}