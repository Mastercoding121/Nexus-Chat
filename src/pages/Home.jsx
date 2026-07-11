import { useNavigate } from 'react-router-dom'
import { mockChats } from '../data/mockChats'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Select a chat to start messaging</p>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Your latest conversations are ready for voice, media, and encrypted chat.</p>

        <div className="mt-6 space-y-2">
          {mockChats.slice(0, 3).map(chat => (
            <button
              key={chat.id}
              onClick={() => navigate(`/app/chat/${chat.id}`)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="font-medium text-gray-900 dark:text-white">{chat.title}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Open →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
