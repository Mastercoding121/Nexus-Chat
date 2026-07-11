import { Apple, ArrowRight, Grid2x2, Moon, Sun, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Header({ showSignIn = true }) {
  const [theme, setTheme] = useState('light')
  const [logoStyle, setLogoStyle] = useState('brand-float')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('nexus-theme') : null
    const resolved = stored || 'light'
    setTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved

    // pick a random logo animation/style on load
    const styles = ['brand-float', 'brand-spin', 'brand-wiggle', 'brand-pulse']
    setLogoStyle(randomChoice(styles))
  }, [])

  const themeClasses = useMemo(() => theme === 'dark'
    ? {
        shell: 'border-white/10 bg-slate-950/80 text-slate-100 shadow-slate-900/40',
        secondaryButton: 'border-slate-200/20 bg-white/10 text-slate-100 hover:bg-white/20',
        button: 'bg-blue-600 text-white hover:bg-blue-500'
      }
    : {
        shell: 'border-slate-200 bg-white/80 text-slate-900 shadow-slate-200/70',
        secondaryButton: 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200',
        button: 'bg-blue-600 text-white hover:bg-blue-500'
      }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nexus-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
  }

  // preserve capability to detect Capacitor/native platform without importing
  const isNative = typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()

  return (
    <header className={`sticky top-0 z-50 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-b px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:px-6 lg:px-8 ${themeClasses.shell}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="brand-badge flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-sky-500 via-cyan-400 to-blue-600 p-1 shadow-[0_18px_45px_rgba(59,130,246,0.30)]">
          <div className={`brand-spin flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/90 shadow-[inset_0_1px_15px_rgba(255,255,255,0.18)] ${logoStyle}`}>
            <img src="/logo.png" alt="Nexus logo" className="brand-float h-8 w-8 rounded-lg object-contain" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-blue-500">Nexus</p>
          <h1 className="truncate text-sm font-semibold sm:text-base">Privacy-first encrypted messaging</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <button onClick={toggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${themeClasses.secondaryButton}`} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {!isNative && showSignIn && (
          <Link to="/login" className={`rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 ${themeClasses.button}`}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
