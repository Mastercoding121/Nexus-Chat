import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRoundCheck, UserRoundX, X } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const emptyForm = { id: '', member_id: '', first_name: '', last_name: '', email: '', user_password: '', role: 'user', is_active: true }

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const request = async (method, selectedUser) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Your Admin session has expired. Please sign in again.')
    const response = await fetch('/api/admin/users', {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: selectedUser }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unable to complete request.')
    return result
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await request('GET')
      setUsers(result.users || [])
      setMessage('Users refreshed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const visibleUsers = useMemo(() => users.filter((candidate) => {
    const text = `${candidate.full_name || ''} ${candidate.member_id || ''} ${candidate.email || ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (statusFilter === 'all' || (statusFilter === 'active') === candidate.is_active)
  }), [users, query, statusFilter])

  const saveUser = async (event) => {
    event.preventDefault()
    try {
      await request(form.id ? 'PATCH' : 'POST', form)
      setForm(emptyForm)
      setMessage(form.id ? 'User updated.' : 'User created.')
      await loadUsers()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save user.')
    }
  }

  const removeUser = async (candidate) => {
    if (!window.confirm(`Delete ${candidate.full_name || candidate.member_id}?`)) return
    try {
      await request('DELETE', { id: candidate.id })
      setMessage('User deleted.')
      await loadUsers()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete user.')
    }
  }

  const toggleStatus = async (candidate) => {
    try {
      await request('PATCH', { ...candidate, user_password: '', is_active: !candidate.is_active })
      setMessage(candidate.is_active ? 'User deactivated.' : 'User activated.')
      await loadUsers()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update status.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm"><Link to="/admin/dashboard" className="text-slate-400 hover:text-white">Dashboard</Link><Link to="/admin/users" className="font-semibold text-blue-400">Users</Link><Link to="/admin/support" className="text-slate-400 hover:text-white">Support</Link><Link to="/admin/settings" className="text-slate-400 hover:text-white">Settings</Link></nav>
        <div className="mb-8 flex flex-col gap-5 rounded-[28px] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-400">People and access</p><h1 className="mt-2 text-3xl font-semibold">User control center</h1><p className="mt-2 text-sm text-slate-400">Create accounts, manage access, and keep inactive users out of the workspace.</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Admin only</span><button type="button" onClick={loadUsers} disabled={loading} title="Refresh users" className="rounded-xl border border-slate-700 p-3 text-slate-300 hover:border-blue-500 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>
        <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
          <form onSubmit={saveUser} className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{form.id ? 'Modify user' : 'Create user'}</h2>{form.id && <button type="button" onClick={() => setForm(emptyForm)} title="Cancel editing" className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>}</div><div className="mt-5 space-y-3">{[['member_id', 'Nexus number'], ['first_name', 'First name'], ['last_name', 'Last name'], ['email', 'Email'], ['user_password', form.id ? 'New password (optional)' : 'Password']].map(([key, label]) => <label key={key} className="block text-sm text-slate-300">{label}<input required={key !== 'email' && !(form.id && key === 'user_password')} type={key === 'user_password' ? 'password' : key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" /></label>)}</div><label className="mt-3 block text-sm text-slate-300">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"><option value="user">User</option><option value="admin">Admin</option></select></label><label className="mt-3 flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />Active account</label><button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">{form.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{form.id ? 'Save changes' : 'Create user'}</button></form>
          <section><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-semibold">All users <span className="text-sm font-normal text-slate-500">{visibleUsers.length} shown</span></h2><div className="flex gap-2"><label className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-400"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="w-36 bg-transparent px-2 py-2 text-sm text-white outline-none" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300"><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div><div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">{visibleUsers.map((candidate) => <div key={candidate.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-4 last:border-0"><div><div className="flex items-center gap-2"><p className="font-medium">{candidate.full_name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unnamed user'}</p><span className={`rounded-full px-2 py-0.5 text-[11px] ${candidate.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{candidate.is_active ? 'Active' : 'Inactive'}</span></div><p className="text-sm text-slate-400">{candidate.member_id || candidate.nexus_id} {candidate.email && `· ${candidate.email}`}</p></div><div className="flex gap-2"><button onClick={() => setForm({ ...emptyForm, ...candidate, user_password: '' })} title="Edit user" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-blue-500"><Pencil className="h-4 w-4" /></button><button onClick={() => toggleStatus(candidate)} title={candidate.is_active ? 'Deactivate user' : 'Activate user'} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-amber-500">{candidate.is_active ? <UserRoundX className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}</button><button onClick={() => removeUser(candidate)} title="Delete user" className="rounded-lg border border-rose-900 p-2 text-rose-300 hover:bg-rose-950"><Trash2 className="h-4 w-4" /></button></div></div>)}{!visibleUsers.length && <p className="p-6 text-sm text-slate-400">No users match the current filters.</p>}</div></section>
        </div>
        {message && <p className="mt-5 text-sm text-slate-400">{message}</p>}
      </div>
    </main>
  )
}
