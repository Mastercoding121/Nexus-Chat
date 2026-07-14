import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Menu, Search, Plus, Sun, Moon } from 'lucide-react'
import ChatListItem from './ChatListItem'
import StoryBar from './StoryBar'
import { useAuth } from '../../lib/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { mockChats } from '../../data/mockChats'
import { createChat, getChats } from '../../lib/persistence'

export default function ChatSidebar({ activeTab, onTabChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, toggleTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [chats, setChats] = useState(mockChats)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { chatId } = useParams()

  useEffect(() => {
    const refreshChats = async () => {
      const nextChats = await getChats()
      setChats(nextChats)
    }
    refreshChats()
    window.addEventListener('nexus-chat:updated', refreshChats)
    return () => window.removeEventListener('nexus-chat:updated', refreshChats)
  }, [])

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChatSelect = (chat) => {
    navigate(`/app/chat/${chat.id}`)
  }

  const handleCreateChat = async () => {
    const newChat = await createChat({ title: 'New chat', type: 'private' })
    navigate(`/app/chat/${newChat.id}`)
  }

  const showChatList = activeTab === 'chats'

  return (
    <div className={`w-full md:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col ${
      chatId ? 'hidden md:flex' : showChatList ? 'flex' : 'hidden md:flex'
    }`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nexus Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
          </button>
          <button
            onClick={handleCreateChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="absolute top-16 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48">
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => { setShowMenu(false); onTabChange('contacts'); navigate('/app/contacts') }}
          >
            Contacts
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => { setShowMenu(false); onTabChange('settings'); navigate('/app/settings') }}
          >
            Settings
          </button>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => logout()}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Log Out
          </button>
        </div>
      )}

      {showChatList && (
        <>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <StoryBar />

          <div className="flex-1 overflow-y-auto">
            {filteredChats.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                selected={chatId === chat.id}
                onClick={() => handleChatSelect(chat)}
              />
            ))}
          </div>
        </>
      )}

      {!showChatList && (
        <div className="flex-1 flex items-center justify-center p-4">
          <button
            onClick={() => { onTabChange('chats'); navigate('/app') }}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            ← Back to Chats
          </button>
        </div>
      )}
    </div>
  )
}
