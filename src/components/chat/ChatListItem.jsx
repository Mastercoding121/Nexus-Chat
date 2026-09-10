import { memo, useMemo } from 'react'
import Avatar from './Avatar'
import { format } from 'date-fns'
import { Lock } from 'lucide-react'

function ChatListItem({ chat, selected, onClick }) {
  const timeLabel = useMemo(() => {
    if (!chat.last_message_time) return null
    try {
      return format(new Date(chat.last_message_time), 'h:mm a')
    } catch {
      return null
    }
  }, [chat.last_message_time])

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        selected ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
    >
      <Avatar src={chat.avatar_url} alt={chat.title} />
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {chat.title}
            </h3>
            {chat.encrypted && (
              <Lock className="w-3 h-3 text-green-500 flex-shrink-0" />
            )}
          </div>
          {timeLabel && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
              {timeLabel}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {chat.last_message || 'No messages yet'}
          </p>
          {chat.unread_count > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
              {chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(ChatListItem, (prev, next) => {
  return (
    prev.chat.id === next.chat.id &&
    prev.chat.title === next.chat.title &&
    prev.chat.last_message === next.chat.last_message &&
    prev.chat.last_message_time === next.chat.last_message_time &&
    prev.chat.unread_count === next.chat.unread_count &&
    prev.chat.avatar_url === next.chat.avatar_url &&
    prev.chat.encrypted === next.chat.encrypted &&
    prev.selected === next.selected
  )
})
