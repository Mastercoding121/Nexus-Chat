import Avatar from './Avatar'
import { format } from 'date-fns'
import { Lock } from 'lucide-react'

export default function ChatListItem({ chat, selected, onClick }) {
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
          {chat.last_message_time && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
              {format(new Date(chat.last_message_time), 'h:mm a')}
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
