import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_KEY = 'nexus-chat-state-v1'
const CONTACTS_STORAGE_KEY = 'nexus-contacts-state-v1'

function readLocalContacts() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CONTACTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocalContacts(contacts) {
  if (typeof window === 'undefined') return contacts

  try {
    window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts))
  } catch {
    // Ignore storage failures
  }

  return contacts
}

function notifyContactsUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus-contacts:updated'))
  }
}

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus-chat:updated'))
  }
}

function readLocalChats() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (str) => UUID_REGEX.test(str);

export async function readChats() {
  let supabaseChats = [];
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false })
      if (!error && Array.isArray(data)) {
        supabaseChats = data.map(chat => ({
          ...chat,
          id: String(chat.id),
          messages: [],
        }))
      }
    } catch {
      // Fall back to local storage on any Supabase failure.
    }
  }

  const localChats = readLocalChats()
  
  // Merge local and supabase chats, preferring local chats to retain messages/unread state
  const mergedMap = new Map()
  
  // Add local chats first
  localChats.forEach(chat => {
    mergedMap.set(chat.id, chat)
  })
  
  // Add/merge supabase chats
  supabaseChats.forEach(chat => {
    const existing = mergedMap.get(chat.id)
    mergedMap.set(chat.id, {
      ...existing,
      ...chat,
      messages: existing?.messages || chat.messages || [],
    })
  })
  
  return Array.from(mergedMap.values())
}

export async function writeChats(chats) {
  const localChats = writeLocalChats(chats)

  if (supabase && isSupabaseConfigured()) {
    try {
      const chatsToUpsert = localChats
        .filter(chat => isUUID(chat.id))
        .map(chat => ({
          id: chat.id,
          title: chat.title,
          type: chat.type || 'private',
          created_at: chat.created_at || new Date().toISOString(),
        }))

      if (chatsToUpsert.length > 0) {
        await supabase.from('chats').upsert(chatsToUpsert)
      }
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

export async function getContacts() {
  return readLocalContacts()
}

export async function addContact(contactData) {
  const contacts = await getContacts()
  const newContact = {
    id: `${Date.now()}`,
    name: contactData.name,
    nexusId: contactData.nexusId,
    avatarUrl: contactData.avatarUrl || null,
    createdAt: new Date().toISOString(),
  }
  const updatedContacts = [newContact, ...contacts]
  await writeLocalContacts(updatedContacts)
  notifyContactsUpdate()
  return newContact
}

export async function deleteContact(contactId) {
  const contacts = await getContacts()
  const updatedContacts = contacts.filter(c => c.id !== contactId)
  await writeLocalContacts(updatedContacts)
  notifyContactsUpdate()
  return updatedContacts
}

export function formatNexusId(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  return raw
}
