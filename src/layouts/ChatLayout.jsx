import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSetting } from '../hooks/useSetting'
import ChatSidebar from '../components/chat/ChatSidebar'
import BottomNav from '../components/chat/BottomNav'

export default function ChatLayout() {
  const [darkMode] = useSetting('darkMode', false)
  const location = useLocation()
  const navigate = useNavigate()

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
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar activeTab={getActiveTab()} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Outlet />
        </div>
      </div>
      <BottomNav activeTab={getActiveTab()} onTabChange={handleTabChange} />
    </div>
  )
}
