import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const { adminLogin, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin' && user.email === 'elonmusklite@gmail.com') navigate('/admin/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(email, password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-400">Restricted access</p>
        <h1 className="mt-3 text-3xl font-semibold">Administrator sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Authorized personnel only.</p>
        <div className="mt-8 space-y-5">
          <label className="block text-sm font-medium">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500" /></label>
          <label className="block text-sm font-medium">Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500" /></label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50">{loading ? 'Checking...' : 'Sign in'}</button>
        </div>
      </form>
    </main>
  )
}