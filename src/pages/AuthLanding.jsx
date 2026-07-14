import { ArrowRightIcon, SparklesIcon, UsersIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, ShieldCheckIcon, MicrophoneIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { Apple } from 'lucide-react' // Keep Apple icon since Heroicons doesn't have it
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useTheme } from '../hooks/useTheme'

const features = [
  {
    title: 'Instant conversations',
    description: 'Fast, lightweight chats that feel fluid on desktop and mobile alike.',
    icon: SparklesIcon
  },
  {
    title: 'Protected by design',
    description: 'Encrypted rooms, secure sign-in, and protected media sharing for everyday use.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Voice and video ready',
    description: 'Crystal-clear voice calls and a modern interface built for nonstop communication.',
    icon: MicrophoneIcon
  }
]

const platforms = [
  { label: 'Android', icon: DevicePhoneMobileIcon },
  { label: 'iOS/iPad', icon: Apple },
  { label: 'Windows/Tablet', icon: ComputerDesktopIcon }
]

export default function AuthLanding() {
  const { theme } = useTheme()

  const themeClasses = useMemo(() => theme === 'dark'
    ? {
        shell: 'border-white/10 bg-slate-950/80 text-slate-100 shadow-slate-900/40',
        card: 'border-white/10 bg-slate-900/70 text-slate-100',
        muted: 'text-slate-300',
        chip: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
        button: 'bg-blue-600 text-white hover:bg-blue-500',
        secondaryButton: 'border-slate-200/20 bg-white/10 text-slate-100 hover:bg-white/20'
      }
    : {
        shell: 'border-slate-200 bg-white/80 text-slate-900 shadow-slate-200/70',
        card: 'border-slate-200 bg-white/80 text-slate-900',
        muted: 'text-slate-600',
        chip: 'border-blue-200 bg-blue-50 text-blue-700',
        button: 'bg-blue-600 text-white hover:bg-blue-500',
        secondaryButton: 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200'
      },
    [theme])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <Header />

        <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.03fr_0.97fr] lg:gap-12 lg:py-10">
          <section className="max-w-2xl">
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${themeClasses.chip}`}>
              <SparklesIcon className="h-4 w-4" />
              Privacy-first encrypted messaging experience
            </div>
            <h2 className="text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Connect with private conversations and a privacy-first messaging hub.
            </h2>
            <p className={`mt-5 max-w-xl text-lg leading-8 ${themeClasses.muted}`}>
              Launch secure chats, share media, make voice calls, and keep your conversations encrypted across desktop and mobile.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold transition ${themeClasses.button}`}>
              Create account <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link to="/login" className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition ${themeClasses.secondaryButton}`}>
              Open app <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className={`float-card rounded-2xl border p-4 shadow-sm backdrop-blur ${themeClasses.card}`}>
                    <Icon className="mb-3 h-6 w-6 text-blue-500" />
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className={`mt-1 text-sm ${themeClasses.muted}`}>{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className={`rounded-[28px] border p-6 shadow-2xl backdrop-blur-xl sm:p-7 lg:p-8 ${themeClasses.card}`}>
            <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>Ready-made app download</p>
              <h3 className="mt-2 text-xl font-semibold">Get Nexus for Android, PC, tablets, Mac and iPhone</h3>
              <p className={`mt-2 text-sm ${themeClasses.muted}`}>
                Download the ready-made app package for your device and install it. If your device shows an “Unknown Source” warning, it is safe to proceed and continue the installation.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {typeof navigator !== 'undefined' && (() => {
                  const isAndroidWeb = /Android/i.test(navigator.userAgent) && !(typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform())
                  return isAndroidWeb ? (
                    <a href="https://nexus-chat-sandy-alpha.vercel.app/app-release.apk" download className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${themeClasses.button}`}>
                      <ArrowDownTrayIcon className="h-4 w-4" /> Android app
                    </a>
                  ) : (
                    <a href="https://developer.android.com/studio" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${themeClasses.button}`}>
                      <ArrowDownTrayIcon className="h-4 w-4" /> Android app
                    </a>
                  )
                })()}
                <a href="https://developer.apple.com/xcode/" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${themeClasses.secondaryButton}`}>
                  <Apple className="h-4 w-4" /> iOS app
                </a>
                <Link to="/login" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${themeClasses.secondaryButton}`}>
                  <ArrowRightIcon className="h-4 w-4" /> Open app
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <UsersIcon className="h-4 w-4 text-blue-500" />
              Included experiences
            </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Secure sign-in with member number</li>
                <li>• Voice, media and chat support</li>
                <li>• Wallpaper and settings customization</li>
                <li>• Cross-device messaging and privacy controls</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon
                return (
                  <div key={platform.label} className={`float-card flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${theme === 'dark' ? 'border-slate-700 bg-slate-800/70 text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                    <Icon className="h-4 w-4 text-blue-500" /> {platform.label}
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
