import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import ChatSidebar from '../components/chat/ChatSidebar'
import BottomNav from '../components/chat/BottomNav'
import NotificationStack from '../components/chat/NotificationStack'
import Header from '../components/Header'
import { requestNotificationPermission, showSystemNotification } from '../lib/notifications'
import { startRealtimeListeners, stopRealtimeListeners } from '../lib/persistence'

export default function ChatLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  
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
