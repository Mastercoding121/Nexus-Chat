import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const WALLET_KEY = 'nexus-chat-wallet-balances'
const USERS_KEY = 'nexus-chat-users'

export default function AdminWallet() {
  const [users, setUsers] = useState([])
  const [balances, setBalances] = useState({})
  const [amounts, setAmounts] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    try { setBalances(JSON.parse(localStorage.getItem(WALLET_KEY) || '{}')) } catch { setBalances({}) }
    const load = async () => {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.from('members').select('id, member_id, full_name, wallet_balance').order('created_at', { ascending: false })
        if (data) { setUsers(data); return }
      }
      try { setUsers(JSON.parse(localStorage.getItem(USERS_KEY) || '[]')) } catch { setUsers([]) }
    }
    load()
  }, [])

  const adjust = async (user, direction) => {
    const amount = Number(amounts[user.id])
    if (!Number.isFinite(amount) || amount <= 0) { setMessage('Enter a positive adjustment amount.'); return }
    const nextBalance = Number(user.wallet_balance ?? balances[user.id] ?? 0) + direction * amount
    if (nextBalance < 0) { setMessage('Wallet balance cannot be negative.'); return }
    if (isSupabaseConfigured() && supabase) {
      const result = await supabase.from('members').update({ wallet_balance: nextBalance }).eq('id', user.id)
      if (result.error) { setMessage(result.error.message); return }
    }
    const nextBalances = { ...balances, [user.id]: nextBalance }
    setBalances(nextBalances)
    localStorage.setItem(WALLET_KEY, JSON.stringify(nextBalances))
    setMessage('Wallet adjusted.')
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8"><div className="mx-auto max-w-5xl"><nav className="mb-8 flex gap-4 text-sm"><Link to="/admin/dashboard" className="text-slate-400 hover:text-white">Dashboard</Link><Link to="/admin/users" className="text-slate-400 hover:text-white">Users</Link><Link to="/admin/wallet" className="font-semibold text-blue-400">Wallet</Link></nav><h1 className="text-2xl font-semibold">Wallet adjustments</h1><p className="mt-2 text-sm text-slate-400">Credit or debit any user account.</p>{message && <p className="mt-4 text-sm text-blue-300">{message}</p>}<div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">{users.map((user) => { const balance = user.wallet_balance ?? balances[user.id] ?? 0; return <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-4 last:border-0"><div><p className="font-medium">{user.full_name || user.member_id || 'Unnamed user'}</p><p className="text-sm text-slate-400">Balance: {balance.toFixed(2)}</p></div><div className="flex items-center gap-2"><input type="number" min="0.01" step="0.01" placeholder="Amount" value={amounts[user.id] || ''} onChange={(event) => setAmounts({ ...amounts, [user.id]: event.target.value })} className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /><button onClick={() => adjust(user, 1)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm hover:bg-emerald-600">Credit</button><button onClick={() => adjust(user, -1)} className="rounded-lg bg-rose-800 px-3 py-2 text-sm hover:bg-rose-700">Debit</button></div></div> })}{!users.length && <p className="p-6 text-sm text-slate-400">No users found.</p>}</div></div></main>
}