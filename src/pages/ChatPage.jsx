import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ChatView from '../components/chat/ChatView'
import { getChatById } from '../data/mockChats'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [chat, setChat] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const syncChat = async () => {
      setLoading(true)
      const nextChat = await getChatById(chatId)
      if (active) {
        setChat(nextChat)
        setLoading(false)
      }
    }
    syncChat()
    
    const handleUpdate = () => {
      syncChat()
    }
    window.addEventListener('nexus-chat:updated', handleUpdate)
    return () => {
      active = false
      window.removeEventListener('nexus-chat:updated', handleUpdate)
    }
  }, [chatId])

  useEffect(() => {
    if (!loading && !chat) {
      navigate('/app', { replace: true })
    }
  }, [chat, loading, navigate])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!chat) return null

  return (
    <ChatView
      chat={chat}
      onBack={() => navigate('/app')}
    />
  )
}
