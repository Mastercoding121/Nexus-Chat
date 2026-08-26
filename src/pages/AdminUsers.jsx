import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LOCAL_USERS_KEY = 'nexus-chat-users'

function readLocalUsers() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]') } catch { return [] }
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ id: '', member_id: '', first_name: '', last_name: '', email: '', password: '' })
  const [message, setMessage] = useState('')

  const loadUsers = async () => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false })
      if (!error && data) { setUsers(data); return }
    }
    setUsers(readLocalUsers())
  }

  useEffect(() => { loadUsers() }, [])

  const reset = () => setForm({ id: '', member_id: '', first_name: '', last_name: '', email: '', password: '' })
  const editUser = (user) => setForm({ id: user.id, member_id: user.member_id || user.nexus_id || '', first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', password: user.password || '' })

  const saveUser = async (event) => {
    event.preventDefault()
    const payload = { ...form, full_name: `${form.first_name} ${form.last_name}`.trim() }
    if (isSupabaseConfigured() && supabase) {
      const result = form.id ? await supabase.from('members').update(payload).eq('id', form.id) : await supabase.from('members').insert(payload)
      if (result.error) { setMessage(result.error.message); return }
    }
    const localUsers = readLocalUsers()
    const nextUsers = form.id ? localUsers.map((user) => user.id === form.id ? { ...user, ...payload } : user) : [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...localUsers]
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(nextUsers))
    setMessage(form.id ? 'User updated.' : 'User created.')
    reset()
    loadUsers()
  }

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.full_name || user.member_id}?`)) return
    if (isSupabaseConfigured() && supabase) {
      const result = await supabase.from('members').delete().eq('id', user.id)
      if (result.error) { setMessage(result.error.message); return }
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(readLocalUsers().filter((candidate) => candidate.id !== user.id)))
    setMessage('User deleted.')
    loadUsers()
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm"><Link to="/admin/dashboard" className="text-slate-400 hover:text-white">Dashboard</Link><Link to="/admin/users" className="font-semibold text-blue-400">Users</Link><Link to="/admin/wallet" className="text-slate-400 hover:text-white">Wallet</Link></nav>
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <form onSubmit={saveUser} className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h1 className="text-xl font-semibold">{form.id ? 'Modify user' : 'Create user'}</h1>
            <div className="mt-5 space-y-3">{[['member_id', 'Nexus number'], ['first_name', 'First name'], ['last_name', 'Last name'], ['email', 'Email'], ['password', 'Password']].map(([key, label]) => <label key={key} className="block text-sm text-slate-300">{label}<input required={key !== 'email'} type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" /></label>)}</div>
            <div className="mt-5 flex gap-3"><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">{form.id ? 'Save changes' : 'Create user'}</button>{form.id && <button type="button" onClick={reset} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Cancel</button>}</div>
            {message && <p className="mt-4 text-sm text-slate-400">{message}</p>}
          </form>
          <section><h2 className="text-xl font-semibold">All users <span className="text-sm font-normal text-slate-500">{users.length}</span></h2><div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">{users.map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-4 last:border-0"><div><p className="font-medium">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed user'}</p><p className="text-sm text-slate-400">{user.member_id || user.nexus_id} {user.email && `· ${user.email}`}</p></div><div className="flex gap-2"><button onClick={() => editUser(user)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-blue-500">Edit</button><button onClick={() => deleteUser(user)} className="rounded-lg border border-rose-900 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950">Delete</button></div></div>)}{!users.length && <p className="p-6 text-sm text-slate-400">No users found.</p>}</div></section>
        </div>
      </div>
    </main>
  )
}