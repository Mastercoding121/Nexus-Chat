import { Routes, Route } from 'react-router-dom'
import { useSetting } from '../hooks/useSetting'
import SettingsShell from '../components/chat/settings/SettingsShell'
import SettingsRow from '../components/chat/settings/SettingsRow'
import AppearanceSettings from '../components/chat/settings/AppearanceSettings'
import PrivacySettings from '../components/chat/settings/PrivacySettings'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

function SettingsMenu() {
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useSetting('darkMode', false)

  const sections = [
    { id: 'appearance', label: 'Appearance', description: 'Wallpaper, theme' },
    { id: 'privacy', label: 'Privacy & Security', description: 'Encryption, security code' },
  ]

  return (
    <SettingsShell>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      <SettingsRow label="Dark Mode">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            darkMode ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </SettingsRow>

      <div className="mt-6">
        <button
          onClick={() => navigate('/app/settings/appearance')}
          className="w-full flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="text-left">
            <p className="text-gray-900 dark:text-white font-medium">Change Chat Wallpaper</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pick an open-source wallpaper for your chat view</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => navigate(`/settings/${section.id}`)}
            className="w-full flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="text-left">
              <p className="text-gray-900 dark:text-white font-medium">{section.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>
    </SettingsShell>
  )
}

function SettingsSubPage({ title, children }) {
  const navigate = useNavigate()

  return (
    <SettingsShell>
      <button
        onClick={() => navigate('/app/settings')}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </button>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h2>
      {children}
    </SettingsShell>
  )
}

export default function SettingsPage() {
  const location = useLocation()
  const subPath = location.pathname.split('/app/settings/')[1]

  if (subPath === 'appearance') {
    return (
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <SettingsSubPage title="Appearance">
          <AppearanceSettings />
        </SettingsSubPage>
      </div>
    )
  }

  if (subPath === 'privacy') {
    return (
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <SettingsSubPage title="Privacy & Security">
          <PrivacySettings />
        </SettingsSubPage>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      <SettingsMenu />
    </div>
  )
}
