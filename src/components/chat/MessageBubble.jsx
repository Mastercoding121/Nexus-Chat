import { memo, useMemo } from 'react'
import { format } from 'date-fns'
import { FileText, Download, Film, Music } from 'lucide-react'

function formatTime(dateString) {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '...'
    }
    return format(date, 'h:mm a')
  } catch {
    return '...'
  }
}

function MessageBubble({ message, isOwn }) {
  const timeLabel = useMemo(() => formatTime(message.created_at), [message.created_at])
  const isSticker = message.type === 'sticker'

  const renderContent = useMemo(() => {
    switch (message.type) {
      case 'text':
        return <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>

      case 'image':
        return (
          <img
            src={message.file_url}
            alt="Shared image"
            className="max-w-xs sm:max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition"
            onClick={() => window.open(message.file_url, '_blank')}
          />
        )

      case 'video':
        return (
          <div className="max-w-xs sm:max-w-sm">
            <video
              src={message.file_url}
              controls
              className="rounded-lg w-full"
              preload="metadata"
            />
            {message.file_name && (
              <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                <Film className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{message.file_name}</span>
              </p>
            )}
          </div>
        )

      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[180px] sm:min-w-[240px]">
            <Music className="w-4 h-4 flex-shrink-0" />
            <audio
              src={message.file_url}
              controls
              className="h-7 sm:h-8 flex-1"
            />
            {message.duration && (
              <span className="text-xs opacity-75 flex-shrink-0">{message.duration}s</span>
            )}
          </div>
        )

      case 'sticker':
        return (
          <span className="text-4xl sm:text-5xl leading-none select-none" role="img">
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
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
          >
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">
                {message.file_name || message.content}
              </p>
              <p className="text-xs opacity-75 flex items-center gap-1">
                <Download className="w-3 h-3 flex-shrink-0" />
                Tap to download
              </p>
            </div>
          </a>
        )

      default:
        return <p className="text-xs sm:text-sm">{message.content}</p>
    }
  }, [message.type, message.content, message.file_url, message.file_name, message.duration])

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-0`}>
      <div
        className={
          isSticker
            ? 'max-w-[80%] sm:max-w-[70%]'
            : `max-w-[80%] sm:max-w-[60%] px-3 sm:px-4 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
                  : 'bg-muted text-foreground rounded-tl-none shadow-sm'
              }`
        }
      >
        {renderContent}
        {!isSticker && (
          <div className={`text-xs mt-1 opacity-70 ${isOwn ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            {timeLabel}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(MessageBubble, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.created_at === next.message.created_at &&
    prev.isOwn === next.isOwn
  )
})
