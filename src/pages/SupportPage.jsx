import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import ChatView from '../components/chat/ChatView'
import { createChat, getChatById, getSupportMessages, startRealtimeListeners, stopRealtimeListeners } from '../lib/persistence'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LOCAL_USERS_KEY = 'nexus-chat-users'

function supportChatId(userId) {
  return `support-${userId}`
}

function displayName(user) {
  return user?.full_name || user?.fullName || `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || user?.member_id || user?.nexusId || 'User'
}

export default function SupportPage({ adminMode = false }) {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(adminMode ? null : user)
  const [chat, setChat] = useState(null)

  useEffect(() => {
    if (!adminMode) return undefined
    const channel = startRealtimeListeners()
    return () => stopRealtimeListeners(channel)
  }, [adminMode])

  useEffect(() => {
    if (!adminMode) {
      setSelectedUser(user)
      return
    }

    const loadUsers = async () => {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.from('members').select('id, member_id, full_name, first_name, last_name, avatar_url').order('created_at', { ascending: false })
        if (data) { setUsers(data); if (data[0]) setSelectedUser(data[0]); return }
      }
      try {
        const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
        setUsers(localUsers)
        if (localUsers[0]) setSelectedUser(localUsers[0])
      } catch { setUsers([]) }
    }
    loadUsers()
  }, [adminMode, user])

  useEffect(() => {
    if (!selectedUser) return
    let active = true
    const loadChat = async () => {
      const id = supportChatId(selectedUser.id || selectedUser.member_id || selectedUser.nexusId)
      let nextChat = await getChatById(id)
      if (!nextChat) {
        nextChat = await createChat({ id, title: `Nexus Support · ${displayName(selectedUser)}`, type: 'support', avatar_url: selectedUser.avatar_url || selectedUser.avatarUrl || null })
      }
      if (!nextChat.avatar_url && (selectedUser.avatar_url || selectedUser.avatarUrl)) {
        nextChat = { ...nextChat, avatar_url: selectedUser.avatar_url || selectedUser.avatarUrl }
      }
      nextChat = { ...nextChat, messages: await getSupportMessages(id) }
      if (active) setChat(nextChat)
    }
    loadChat()
    const refresh = () => loadChat()
    window.addEventListener('nexus-chat:updated', refresh)
    return () => { active = false; window.removeEventListener('nexus-chat:updated', refresh) }
  }, [selectedUser])

  if (adminMode) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-slate-100 sm:px-8 sm:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col sm:min-h-[calc(100vh-4rem)]">
          <nav className="mb-4 flex shrink-0 gap-4 overflow-x-auto whitespace-nowrap text-sm sm:mb-6"><Link to="/admin/dashboard" className="text-slate-400 hover:text-white">Dashboard</Link><Link to="/admin/users" className="text-slate-400 hover:text-white">Users</Link><Link to="/admin/support" className="font-semibold text-blue-400">Support</Link></nav>
          <h1 className="shrink-0 text-xl font-semibold sm:text-2xl">Support conversations</h1>
          <div className="mt-4 grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 sm:mt-6 sm:rounded-2xl lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-none">
            <aside className="flex max-h-36 overflow-x-auto overflow-y-hidden border-b border-slate-800 lg:block lg:max-h-none lg:overflow-y-auto lg:border-b-0 lg:border-r">{users.map((candidate) => <button key={candidate.id} onClick={() => setSelectedUser(candidate)} className={`min-w-[170px] border-r border-slate-800 px-4 py-3 text-left hover:bg-slate-800 lg:block lg:w-full lg:border-b lg:border-r-0 lg:py-4 ${selectedUser?.id === candidate.id ? 'bg-slate-800' : ''}`}><p className="truncate font-medium">{displayName(candidate)}</p><p className="mt-1 text-xs text-slate-400">{candidate.member_id || candidate.nexus_id}</p></button>)}{!users.length && <p className="p-4 text-sm text-slate-400">No users found.</p>}</aside>
            <div className="min-h-0">{chat ? <ChatView chat={chat} currentUserId={user?.id || 'admin'} supportConversationId={supportChatId(selectedUser.id || selectedUser.member_id || selectedUser.nexusId)} /> : <p className="p-6 text-slate-400">Select a user to open support chat.</p>}</div>
          </div>
        </div>
      </main>
    )
  }

  return <div className="flex min-h-0 flex-1 bg-background">{chat ? <ChatView chat={chat} currentUserId={user?.id || 'me'} supportConversationId={supportChatId(user?.id || user?.nexusId)} onBack={() => window.history.back()} /> : <div className="p-6 text-muted-foreground sm:p-8">Loading support chat...</div>}</div>
}