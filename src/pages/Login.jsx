import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const [memberId, setMemberId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState('light')
  const { login } = useAuth()
  const navigate = useNavigate()

  const themeClasses = useMemo(() => theme === 'dark'
    ? {
        shell: 'border-white/10 bg-slate-950/80 text-slate-100',
        card: 'border-white/10 bg-slate-900/80 text-slate-100',
        muted: 'text-slate-300',
        input: 'border-slate-700 bg-slate-800 text-white focus:border-blue-500',
        button: 'bg-blue-600 text-white hover:bg-blue-500'
      }
    : {
        shell: 'border-slate-200 bg-white/80 text-slate-900',
        card: 'border-slate-200 bg-white/80 text-slate-900',
        muted: 'text-slate-600',
        input: 'border-slate-300 bg-white text-slate-900 focus:border-blue-500',
        button: 'bg-blue-600 text-white hover:bg-blue-500'
      }, [theme])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(memberId, password)
      const destination = result?.user?.role === 'admin' ? '/admin' : '/app'
      navigate(destination)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back to Nexus"
      subtitle="Sign in using your unique 10-digit member number and password. Your session stays locked in until you log out."
      compact
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className={`flex-1 rounded-[24px] border p-8 ${theme === 'dark' ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-slate-900' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'}`}>
          <div className={`rounded-full border px-3 py-1 text-sm ${theme === 'dark' ? 'border-blue-400/30 bg-blue-500/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            Secure access
          </div>
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" /> Protected by end-to-end encryption
            </div>
          </div>
        </div>

        <div className={`w-full max-w-md rounded-[24px] border p-6 shadow-lg ${themeClasses.card}`}>
          <h2 className="text-2xl font-semibold">Member login</h2>
          <p className={`mt-2 text-sm ${themeClasses.muted}`}>Use your member number issued during registration.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className={`mb-2 block text-sm font-medium ${themeClasses.muted}`}>Member number</label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition ${themeClasses.input}`}
                placeholder="4829157310"
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${themeClasses.muted}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${themeClasses.input}`}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${themeClasses.button} disabled:bg-slate-600`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </Link>
            <p className="text-sm text-slate-400">
              New here?{' '}
              <Link to="/register" className="font-semibold text-blue-500 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
