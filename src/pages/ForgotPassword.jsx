import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useTheme } from '../hooks/useTheme'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()

  const themeClasses = useMemo(() => theme === 'dark'
    ? {
        muted: 'text-slate-300',
        input: 'border-slate-700 bg-slate-800 text-white focus:border-primary focus:ring-primary',
        button: 'bg-primary text-white hover:bg-primary/90'
      }
    : {
        muted: 'text-slate-600',
        input: 'border-slate-300 bg-white text-slate-900 focus:border-primary focus:ring-primary',
        button: 'bg-primary text-white hover:bg-primary/90'
      }, [theme])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // TODO: Implement password reset email logic
      setMessage('Password reset email sent! Check your inbox.')
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter the email connected to your account and we’ll guide you through the reset flow." compact>
      <div className="mx-auto w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`mb-2 block text-sm font-medium ${themeClasses.muted}`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition ${themeClasses.input}`}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {message && <p className="text-center text-sm text-green-500">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed ${themeClasses.button} disabled:bg-slate-400`}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
        <p className={`mt-6 text-center text-sm ${themeClasses.muted}`}>
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
      </div>
    </AuthShell>
  )
}
