import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, LoaderCircle, Play } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function AdminSettings() {
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const runDatabaseSync = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus('')
    setOutput('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Your Admin session has expired. Please sign in again.')
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      })
      if (passwordError) throw new Error('The administrator password is incorrect.')
      const response = await fetch('/api/admin/db-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const responseText = await response.text()
      let result = {}
      try {
        result = responseText ? JSON.parse(responseText) : {}
      } catch {
        throw new Error(`Database sync failed (HTTP ${response.status}).`)
      }
      if (!response.ok) throw new Error(result.error || 'Database sync failed.')
      setStatus('Database sync completed successfully.')
      setOutput(result.output || 'Schema applied and verification completed.')
      setPassword('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Database sync failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Admin settings</p>
            <h1 className="mt-2 text-2xl font-semibold">Workspace controls</h1>
          </div>
          <Link to="/admin/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">Back to dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap gap-4 text-sm">
          <Link to="/admin/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Dashboard</Link>
          <Link to="/admin/users" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Users</Link>
          <Link to="/admin/support" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Support</Link>
          <Link to="/admin/settings" className="font-semibold text-blue-600">Settings</Link>
        </nav>

        <section className="max-w-2xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><Database className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-semibold">Database schema sync</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Apply missing tables, columns, policies, functions, and realtime configuration, then run the database verification checks.</p>
            </div>
          </div>

          <form onSubmit={runDatabaseSync} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Confirm administrator password
              <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? 'Syncing database...' : 'Run database sync'}
            </button>
          </form>

          {status && <p className={`mt-5 text-sm ${status.includes('successfully') ? 'text-emerald-600' : 'text-rose-600'}`}>{status}</p>}
          {output && <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-200">{output}</pre>}
        </section>
      </main>
    </div>
  )
}