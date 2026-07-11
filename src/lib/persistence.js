import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_KEY = 'nexus-chat-state-v1'

function createSeedChats() {
  return [
    {
      id: '1',
      title: 'Alice Smith',
      type: 'private',
      avatar_url: null,
      last_message: 'Hey, how are you?',
      last_message_time: new Date().toISOString(),
      unread_count: 2,
      encrypted: true,
      messages: [
        {
          id: 'seed-1',
          sender_id: 'other',
          content: 'Hey! How are you doing?',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'seed-2',
          sender_id: 'me',
          content: 'I\'m doing great, thanks for asking!',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
      ],
    },
    {
      id: '2',
      title: 'Nexus Team',
      type: 'group',
      avatar_url: null,
      last_message: 'Meeting tomorrow at 10am',
      last_message_time: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 0,
      encrypted: false,
      messages: [
        {
          id: 'seed-3',
          sender_id: 'other',
          content: 'Meeting tomorrow at 10am',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 3700000).toISOString(),
        },
      ],
    },
    {
      id: '3',
      title: 'Bob Johnson',
      type: 'private',
      avatar_url: null,
      last_message: 'Thanks for the help!',
      last_message_time: new Date(Date.now() - 7200000).toISOString(),
      unread_count: 0,
      encrypted: true,
      messages: [
        {
          id: 'seed-4',
          sender_id: 'other',
          content: 'Thanks for the help!',
          type: 'text',
          encrypted: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    },
  ]
}

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus-chat:updated'))
  }
}

function readLocalChats() {
  if (typeof window === 'undefined') return createSeedChats()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedChats()

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed?.chats) return parsed.chats
  } catch {
    // Fall back to seeded data when storage is unavailable or invalid.
  }

  return createSeedChats()
}

function writeLocalChats(chats) {
  if (typeof window === 'undefined') return chats

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }

  return chats
}

function notifyChatUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus-chat:updated'))
  }
}

export function startRealtimeListeners() {
  if (!supabase || !isSupabaseConfigured()) return null

  const channel = supabase.channel('public-realtime')

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    async (payload) => {
      const msg = payload.new
      if (!msg || !msg.chat_id) return

      await appendMessage(String(msg.chat_id), {
        id: String(msg.id),
        sender_id: String(msg.sender_id || 'other'),
        content: msg.content,
        type: msg.type || 'text',
        file_url: msg.file_url || null,
        file_name: msg.file_name || null,
        encrypted: Boolean(msg.encrypted),
        created_at: msg.created_at || new Date().toISOString(),
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus:incoming-notification', {
          detail: {
            title: 'New message',
            preview: msg.type === 'text' ? msg.content : 'New attachment received',
            avatarUrl: '/logo.png',
            type: 'message',
          },
        }))
      }
    }
  )

  const chatChanged = async () => {
    await readChats()
    notifyChatUpdate()
  }

  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, chatChanged)
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, chatChanged)
  channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chats' }, chatChanged)

  channel.subscribe()
  return channel
}

export function stopRealtimeListeners(channel) {
  if (channel && typeof channel.unsubscribe === 'function') {
    channel.unsubscribe()
  }
}

export async function readChats() {
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false })
      if (!error && Array.isArray(data)) {
        return data.map(chat => ({
          ...chat,
          id: String(chat.id),
          messages: [],
        }))
      }
    } catch {
      // Fall back to local storage on any Supabase failure.
    }
  }

  return readLocalChats()
}

export async function writeChats(chats) {
  const localChats = writeLocalChats(chats)

  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('chats').upsert(localChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        type: chat.type || 'private',
        created_at: chat.created_at || new Date().toISOString(),
      })))
    } catch {
      // Keep local storage as the source of truth when Supabase is unavailable.
    }
  }

  notifyChange()
  return localChats
}

export async function getChats() {
  return readChats()
}

export async function appendMessage(chatId, message) {
  const chats = await getChats()
  const chat = chats.find(item => item.id === chatId)

  if (!chat) return null

  const nextMessage = {
    id: message.id || `${Date.now()}`,
    sender_id: message.sender_id || 'me',
    content: message.content || '',
    type: message.type || 'text',
    encrypted: Boolean(message.encrypted),
    file_url: message.file_url || null,
    file_name: message.file_name || null,
    duration: message.duration || null,
    created_at: message.created_at || new Date().toISOString(),
  }

  const existingMessages = Array.isArray(chat.messages) ? chat.messages : []
  if (existingMessages.some((m) => m.id === nextMessage.id)) {
    return chat
  }

  const updatedChat = {
    ...chat,
    messages: [...existingMessages, nextMessage],
    last_message: nextMessage.content,
    last_message_time: nextMessage.created_at,
    unread_count: 0,
  }

  const updatedChats = chats.map(item => (item.id === chatId ? updatedChat : item))
  await writeChats(updatedChats)
  return updatedChat
}

export async function getChatById(chatId) {
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: chatData, error: chatError } = await supabase.from('chats').select('*').eq('id', chatId).single()
      if (!chatError && chatData) {
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })

        if (!messageError && Array.isArray(messageData)) {
          return {
            ...chatData,
            id: String(chatData.id),
            messages: messageData.map((msg) => ({
              ...msg,
              id: String(msg.id),
            })),
          }
        }

        return {
          ...chatData,
          id: String(chatData.id),
          messages: [],
        }
      }
    } catch {
      // Fall back to local persistence on any Supabase failure.
    }
  }

  const chats = await getChats()
  return chats.find(chat => chat.id === chatId) || null
}

export async function createChat(chatData) {
  const chats = await getChats()
  const newChat = {
    id: `${Date.now()}`,
    title: chatData.title || 'New Chat',
    type: chatData.type || 'private',
    avatar_url: chatData.avatar_url || null,
    last_message: chatData.last_message || 'New conversation',
    last_message_time: new Date().toISOString(),
    unread_count: 0,
    encrypted: Boolean(chatData.encrypted),
    messages: chatData.messages || [],
  }

  await writeChats([newChat, ...chats])
  return newChat
}
