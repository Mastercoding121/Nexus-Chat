import { supabase, isSupabaseConfigured } from './supabase'

export async function fetchSupabaseChats() {
  if (!supabase || !isSupabaseConfigured()) return []

  const { data, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function sendSupabaseMessage(chatId, message) {
  if (!supabase || !isSupabaseConfigured()) return null

  const { data, error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: message.sender_id || null,
    content: message.content,
    type: message.type || 'text',
    file_url: message.file_url || null,
    file_name: message.file_name || null,
    encrypted: Boolean(message.encrypted),
  }).select().single()

  if (error) throw error
  return data
}
