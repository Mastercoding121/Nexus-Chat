import { format } from 'date-fns'
import { FileText, Download, Film, Music } from 'lucide-react'

export default function MessageBubble({ message, isOwn }) {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

      case 'image':
        return (
          <img
            src={message.file_url}
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(message.file_url, '_blank')}
          />
        )

      case 'video':
        return (
          <div className="max-w-xs">
            <video
              src={message.file_url}
              controls
              className="rounded-lg w-full"
              preload="metadata"
            />
            {message.file_name && (
              <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                <Film className="w-3 h-3" />
                {message.file_name}
              </p>
            )}
          </div>
        )

      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Music className="w-4 h-4 flex-shrink-0" />
            <audio
              src={message.file_url}
              controls
              className="h-8 flex-1"
              style={{ maxWidth: '180px' }}
            />
            {message.duration && (
              <span className="text-xs opacity-75">{message.duration}s</span>
            )}
          </div>
        )

      case 'sticker':
        return (
          <span className="text-5xl leading-none select-none" role="img">
            {message.content}
          </span>
        )

      case 'document':
      case 'file':
        return (
          <a
            href={message.file_url}
            download={message.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 transition-colors"
          >
            <FileText className="w-8 h-8 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {message.file_name || message.content}
              </p>
              <p className="text-xs opacity-75 flex items-center gap-1">
                <Download className="w-3 h-3" />
                Tap to download
              </p>
            </div>
          </a>
        )

      default:
        return <p className="text-sm">{message.content}</p>
    }
  }

  const isSticker = message.type === 'sticker'

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isSticker
            ? 'max-w-[75%]'
            : `max-w-[75%] px-4 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none shadow-sm'
              }`
        }
      >
        {renderContent()}
        {!isSticker && (
          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {format(new Date(message.created_at), 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  )
}
