import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ChatView from '../components/chat/ChatView'
import { getChatById } from '../data/mockChats'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [chat, setChat] = useState(() => getChatById(chatId))

  useEffect(() => {
    const syncChat = async () => {
      const nextChat = await getChatById(chatId)
      setChat(nextChat)
    }
    syncChat()
    window.addEventListener('nexus-chat:updated', syncChat)
    return () => window.removeEventListener('nexus-chat:updated', syncChat)
  }, [chatId])

  useEffect(() => {
    if (!chat) navigate('/', { replace: true })
  }, [chat, navigate])

  if (!chat) return null

  return (
    <ChatView
      chat={chat}
      onBack={() => navigate('/app')}
    />
  )
}
