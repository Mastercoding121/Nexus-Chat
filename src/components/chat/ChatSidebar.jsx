import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import ChatListItem from './ChatListItem'
import { useAuth } from '../../lib/AuthContext'
import { mockChats } from '../../data/mockChats'
import { createChat, getChats } from '../../lib/persistence'

export default function ChatSidebar({ activeTab, onTabChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [chats, setChats] = useState(mockChats)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { chatId } = useParams()

  useEffect(() => {
    const refreshChats = async () => {
      const nextChats = await getChats()
      setChats(Array.isArray(nextChats) ? nextChats : [])
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
    <div className={`w-full md:w-96 bg-card border-r border-border flex flex-col ${
      chatId ? 'hidden md:flex' : showChatList ? 'flex' : 'hidden md:flex'
    }`}>
      {showChatList && (
        <>
          <div className="p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border-none rounded-lg text-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length > 0 ? (
              filteredChats.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  selected={chatId === chat.id}
                  onClick={() => handleChatSelect(chat)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium text-center">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1 text-center">Start a new chat to begin messaging</p>
              </div>
            )}
          </div>
        </>
      )}

      {!showChatList && (
        <div className="flex-1 flex items-center justify-center p-4">
          <button
            onClick={() => { onTabChange('chats'); navigate('/app') }}
            className="text-primary text-sm hover:underline"
          >
            ← Back to Chats
          </button>
        </div>
      )}
    </div>
  )
}
