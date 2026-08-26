import { useState, useRef, useEffect } from 'react'
import { ArrowLeftIcon, PhoneIcon, EllipsisVerticalIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import Avatar from './Avatar'
import MessageInput from './MessageInput'
import MessageBubble from './MessageBubble'
import VoiceCallOverlay from './VoiceCallOverlay'
import { useSetting } from '../../hooks/useSetting'
import { getWallpaperById } from '../../lib/wallpapers'
import { encryptMessage, decryptMessage, isE2EEEnabled } from '../../lib/crypto/e2ee'
import { useVoiceCall } from '../../hooks/useVoiceCall'
import { appendMessage } from '../../lib/persistence'
import { sendSupabaseMessage } from '../../lib/supabaseChat'
import { showIncomingNotification } from '../../lib/notifications'

export default function ChatView({ chat, onBack }) {
  const [messages, setMessages] = useState(chat?.messages || [])
  const [decryptedMessages, setDecryptedMessages] = useState({})
  const messagesEndRef = useRef(null)
  const [chatWallpaper] = useSetting('chatWallpaper', 'nature')
  const wallpaper = getWallpaperById(chatWallpaper)

  const voiceCall = useVoiceCall(chat.id)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    setMessages(chat?.messages || [])
  }, [chat?.id, chat?.messages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!isE2EEEnabled()) return
    messages.forEach(async (msg) => {
      if (msg.encrypted && !decryptedMessages[msg.id]) {
        const decrypted = await decryptMessage(chat.id, msg.content, true)
        setDecryptedMessages(prev => ({ ...prev, [msg.id]: decrypted }))
      }
    })
  }, [messages, chat.id])

  const handleSendMessage = async (messageData) => {
    let content = messageData.content || messageData
    const type = messageData.type || 'text'
    let encrypted = false

    if (isE2EEEnabled() && type === 'text') {
      const result = await encryptMessage(chat.id, content)
      content = result.content
      encrypted = result.encrypted
    }

    const newMessage = {
      id: Date.now().toString(),
      sender_id: 'me',
      content,
      type,
      encrypted,
      file_url: messageData.file_url || null,
      file_name: messageData.file_name || null,
      duration: messageData.duration || null,
      created_at: new Date().toISOString(),
    }

    if (encrypted) {
      setDecryptedMessages(prev => ({
        ...prev,
        [newMessage.id]: messageData.content || messageData,
      }))
    }

    const savedMessage = await appendMessage(chat.id, newMessage)
    setMessages(prev => [...prev, savedMessage || newMessage])

    if (chat.id && typeof window !== 'undefined') {
      try {
        await sendSupabaseMessage(chat.id, {
          ...newMessage,
          sender_id: newMessage.sender_id,
        })
      } catch {
        // If Supabase messaging is unavailable, continue using local persistence.
      }
    }

    const preview = type === 'text'
      ? (messageData.content || messageData)
      : `${type === 'file' ? 'Shared a file' : type === 'sticker' ? 'Sent a sticker' : type === 'image' ? 'Shared an image' : 'Shared media'} · ${messageData.file_name || 'Tap to view'}`

    showIncomingNotification({
      title: chat.title || 'New activity',
      preview: preview.length > 80 ? `${preview.slice(0, 77)}...` : preview,
      avatarUrl: chat.avatar_url || '/logo.png',
      type,
    })
  }

  const wallpaperStyle = wallpaper.url
    ? {
        backgroundImage: `url(${wallpaper.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      }
    : { background: wallpaper.preview || '#f3f4f6' }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <Avatar src={chat.avatar_url} alt={chat.title} />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 dark:text-white">{chat.title}</h2>
              {(chat.encrypted || isE2EEEnabled()) && (
                <LockClosedIcon className="w-3.5 h-3.5 text-green-500" title="End-to-end encrypted" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {voiceCall.callState === 'connected' ? 'On call' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={voiceCall.initiateCall}
            disabled={voiceCall.callState !== 'idle'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" style={wallpaperStyle}>
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/70 pointer-events-none" />
        <div className="relative space-y-4">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                content: message.encrypted
                  ? (decryptedMessages[message.id] || '🔒 Decrypting...')
                  : message.content,
              }}
              isOwn={message.sender_id === 'me'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput onSendMessage={handleSendMessage} />

      <VoiceCallOverlay
        chat={chat}
        voiceCall={voiceCall}
      />

      <audio id="remote-audio" autoPlay />
    </div>
  )
}
