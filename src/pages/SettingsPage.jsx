import { Routes, Route } from 'react-router-dom'
import { useSetting } from '../hooks/useSetting'
import SettingsShell from '../components/chat/settings/SettingsShell'
import SettingsRow from '../components/chat/settings/SettingsRow'
import AppearanceSettings from '../components/chat/settings/AppearanceSettings'
import PrivacySettings from '../components/chat/settings/PrivacySettings'
import ProfileEdit from '../components/chat/settings/ProfileEdit'
import Avatar from '../components/chat/Avatar'
import { useAuth } from '../lib/AuthContext'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

function SettingsMenu() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const sections = [
    { id: 'appearance', label: 'Appearance', description: 'Wallpaper, theme' },
    { id: 'privacy', label: 'Privacy & Security', description: 'Encryption, security code' },
  ]

  return (
    <SettingsShell>
      <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>

      {/* User Profile Card */}
      <button 
        onClick={() => navigate('/app/settings/profile')}
        className="w-full flex items-center gap-4 p-4 bg-muted/40 hover:bg-muted/75 rounded-2xl border border-border mb-6 transition duration-200"
      >
        <Avatar src={user?.avatarUrl} alt={user?.fullName || 'User'} size="lg" />
        <div className="flex-1 text-left">
          <h3 className="font-bold text-foreground text-lg leading-tight">{user?.fullName || 'Anonymous User'}</h3>
          <p className="text-xs text-muted-foreground mt-1">Nexus ID: {user?.nexusIdDisplay || '10-XXXX-XXXX'}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="mt-6">
        <button
          onClick={() => navigate('/app/settings/appearance')}
          className="w-full flex items-center justify-between py-4 border-b border-border hover:bg-muted transition-colors"
        >
          <div className="text-left">
            <p className="text-foreground font-medium">Change Chat Wallpaper</p>
            <p className="text-sm text-muted-foreground">Pick an open-source wallpaper for your chat view</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => navigate(`/app/settings/${section.id}`)}
            className="w-full flex items-center justify-between py-4 border-b border-border hover:bg-muted transition-colors"
          >
            <div className="text-left">
              <p className="text-foreground font-medium">{section.label}</p>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
        className="flex items-center gap-2 text-primary mb-4 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </button>
      <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      {children}
    </SettingsShell>
  )
}

export default function SettingsPage() {
  const location = useLocation()
  const subPath = location.pathname.split('/app/settings/')[1]

  if (subPath === 'profile') {
    return (
      <div className="flex-1 overflow-y-auto bg-card">
        <SettingsSubPage title="Profile">
          <ProfileEdit />
        </SettingsSubPage>
      </div>
    )
  }

  if (subPath === 'appearance') {
    return (
      <div className="flex-1 overflow-y-auto bg-card">
        <SettingsSubPage title="Appearance">
          <AppearanceSettings />
        </SettingsSubPage>
      </div>
    )
  }

  if (subPath === 'privacy') {
    return (
      <div className="flex-1 overflow-y-auto bg-card">
        <SettingsSubPage title="Privacy & Security">
          <PrivacySettings />
        </SettingsSubPage>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-card">
      <SettingsMenu />
    </div>
  )
}
