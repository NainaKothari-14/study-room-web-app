import { useRef } from 'react'
import { useRoomContext } from '../../context/RoomContext'
import FileItem from './FileItem'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function FilePanel({ roomId, localUser, onShare }) {
  const { files, addFile } = useRoomContext()
  const inputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large (max 10MB)')
      return
    }

    // In a real app you'd upload to Firebase/Supabase and get a URL
    // Here we create an object URL for demo purposes
    const url = URL.createObjectURL(file)
    const fileInfo = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      uploadedBy: localUser?.name || 'You',
      uploadedAt: new Date().toISOString(),
    }
    addFile(fileInfo)
    onShare(roomId, fileInfo)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-study-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-study-text">Files</h3>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs font-body text-study-accent hover:text-study-accent-light transition-colors"
        >
          + Upload
        </button>
        <input ref={inputRef} type="file" onChange={handleUpload} className="hidden" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.length === 0 && (
          <div className="text-center text-study-muted text-sm font-body mt-8">
            <p className="text-2xl mb-2">📎</p>
            <p>No files shared yet.</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-study-accent hover:underline mt-2 text-xs"
            >
              Upload the first file
            </button>
          </div>
        )}
        {files.map((file) => (
          <FileItem key={file.id} file={file} />
        ))}
      </div>
    </div>
  )
}