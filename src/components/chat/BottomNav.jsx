import { useNavigate } from 'react-router-dom'
import { ChatBubbleLeftRightIcon, UserGroupIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'

const TABS = [
  { id: 'chats', label: 'Chats', icon: ChatBubbleLeftRightIcon, path: '/app' },
  { id: 'feeds', label: 'Feeds', icon: UserIcon, path: '/app/feeds' },
  { id: 'contacts', label: 'Contacts', icon: UserGroupIcon, path: '/app/contacts' },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, path: '/app/settings' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  const navigate = useNavigate()

  const handleTabClick = (tab) => {
    onTabChange(tab.id)
    navigate(tab.path)
  }

  return (
    <div className="sticky bottom-0 z-30 w-full md:hidden border-t border-border bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center py-3 px-2 flex-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className="md:hidden h-[env(safe-area-inset-bottom)] bg-card"></div>
    </div>
  )
}
