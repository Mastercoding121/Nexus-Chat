import { ArrowRight, Briefcase, Download, Mic, Shield, Sparkles, Users, Monitor, Smartphone, Tablet, Apple } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Instant conversations',
    description: 'Fast, lightweight chats that feel fluid on desktop and mobile alike.',
    icon: Sparkles
  },
  {
    title: 'Protected by design',
    description: 'Encrypted rooms, secure sign-in, and protected media sharing for everyday use.',
    icon: Shield
  },
  {
    title: 'Voice and video ready',
    description: 'Crystal-clear voice calls and a modern interface built for nonstop communication.',
    icon: Mic
  }
]

const platforms = [
  { label: 'Android', icon: Smartphone },
  { label: 'PC', icon: Monitor },
  { label: 'Tablet', icon: Tablet },
  { label: 'Mac', icon: Apple },
  { label: 'iPhone', icon: Smartphone }
]

function getThemePreference() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('nexus-theme')
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function AuthLanding() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const currentTheme = getThemePreference()
    setTheme(currentTheme)
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')
    document.documentElement.style.colorScheme = currentTheme
  }, [])

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

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('nexus-theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.style.colorScheme = nextTheme
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8 lg:px-10 lg:py-10">
        <header className={`flex flex-wrap items-center justify-between gap-4 rounded-full border px-4 py-3 shadow-lg backdrop-blur-xl ${themeClasses.shell}`}>
          <div className="flex items-center gap-3">
            <div className="brand-spin flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-sky-300 p-1 shadow-lg">
              <img src="/logo.svg" alt="Nexus logo" className="h-full w-full rounded-xl object-contain" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-500">Nexus</p>
              <h1 className="text-base font-semibold">Secure messaging, reimagined</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`rounded-full px-4 py-2 text-sm font-medium transition ${themeClasses.secondaryButton}`}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <Link to="/invest" className={`rounded-full px-4 py-2 text-sm font-medium transition ${themeClasses.secondaryButton}`}>
              Invest
            </Link>
            <Link to="/login" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${themeClasses.button}`}>
              Sign in
            </Link>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <section className="max-w-2xl">
            <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${themeClasses.chip}`}>
              <Sparkles className="h-4 w-4" />
              Premium secure communication experience
            </div>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              Connect with private conversations and a smarter investment hub.
            </h2>
            <p className={`mt-5 max-w-xl text-lg ${themeClasses.muted}`}>
              Launch secure chats, share media, make voice calls, and explore a polished investment machine with ROI insights from the same modern experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold transition ${themeClasses.button}`}>
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition ${themeClasses.secondaryButton}`}>
                Open dashboard <ArrowRight className="h-4 w-4" />
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

          <section className={`rounded-[28px] border p-6 shadow-2xl backdrop-blur-xl ${themeClasses.card}`}>
            <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>Ready-made app download</p>
              <h3 className="mt-2 text-xl font-semibold">Get Nexus for Android, PC, tablets, Mac and iPhone</h3>
              <p className={`mt-2 text-sm ${themeClasses.muted}`}>
                Download the ready-made app package for your device and install it. If your device shows an “Unknown Source” warning, it is safe to proceed and continue the installation.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="https://github.com/Mastercoding121/Uplifting-The-People.git" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${themeClasses.button}`}>
                  <Download className="h-4 w-4" /> Download app
                </a>
                <Link to="/invest" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${themeClasses.secondaryButton}`}>
                  <Briefcase className="h-4 w-4" /> Explore investment
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Users className="h-4 w-4 text-blue-500" /> Included experiences
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Secure sign-in with member number</li>
                <li>• Voice, media and chat support</li>
                <li>• Wallpaper and settings customization</li>
                <li>• Investment machine with ROI insights</li>
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
