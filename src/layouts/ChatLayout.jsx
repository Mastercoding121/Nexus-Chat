import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import ChatSidebar from '../components/chat/ChatSidebar'
import BottomNav from '../components/chat/BottomNav'
import NotificationStack from '../components/chat/NotificationStack'
import Header from '../components/Header'
import { requestNotificationPermission, showSystemNotification } from '../lib/notifications'
import { startRealtimeListeners, stopRealtimeListeners } from '../lib/persistence'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'

export default function ChatLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, verifyEmail } = useAuth()
  const { theme } = useTheme()
  
  useEffect(() => {
    async function initNotifications() {
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        showSystemNotification({
          title: 'Notification permissions needed',
          preview: 'Enable browser notifications to stay informed of new messages and chat activity.',
        })
      }
    }

    initNotifications()
    const channel = startRealtimeListeners()
    return () => stopRealtimeListeners(channel)
  }, [])

  const getActiveTab = () => {
    if (location.pathname.startsWith('/app/settings')) return 'settings'
    if (location.pathname.startsWith('/app/contacts')) return 'contacts'
    if (location.pathname.startsWith('/app/stories')) return 'stories'
    return 'chats'
  }

  const handleTabChange = (tab) => {
    const routes = {
      chats: '/app',
      stories: '/app/stories',
      contacts: '/app/contacts',
      settings: '/app/settings',
    }
    navigate(routes[tab] || '/app')
  }

  return (
    <div className="h-screen flex flex-col">
      <Header showSignIn={false} />
      {/* Email Verification Banner */}
      {user && !user.emailVerified && (
        <div className={`border-b px-4 py-3 ${theme === 'dark' ? 'bg-amber-900/30 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-amber-200' : 'text-amber-800'}`}>
                Verify your email address to unlock all Nexus features!
              </p>
            </div>
            <button
              onClick={verifyEmail}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${theme === 'dark' ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-amber-600 text-white hover:bg-amber-500'}`}
            >
              Verify now (demo)
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar activeTab={getActiveTab()} onTabChange={handleTabChange} />
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
      <BottomNav activeTab={getActiveTab()} onTabChange={handleTabChange} />
      <NotificationStack />
    </div>
  )
}
