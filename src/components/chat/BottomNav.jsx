import { useNavigate } from 'react-router-dom'
import { MessageCircle, Users, User, Settings } from 'lucide-react'

const TABS = [
  { id: 'chats', label: 'Chats', icon: MessageCircle, path: '/app' },
  { id: 'stories', label: 'Stories', icon: User, path: '/app/stories' },
  { id: 'contacts', label: 'Contacts', icon: Users, path: '/app/contacts' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  const navigate = useNavigate()

  const handleTabClick = (tab) => {
    onTabChange(tab.id)
    navigate(tab.path)
  }

  return (
    <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex justify-around">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center py-3 px-4 ${
                isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
