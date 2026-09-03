import { readFileSync } from 'node:fs'

function readEnv(path) {
  try {
    return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, '')]] : []
    }))
  } catch { return {} }
}

const env = { ...readEnv('.env'), ...readEnv('.env.local'), ...process.env }
const email = String(env.ADMIN_EMAIL || '').trim().toLowerCase()
const password = String(env.ADMIN_PASSWORD || '')
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const secret = env.SUPABASE_SECRET_KEY
if (!url || !secret || !email || !password) throw new Error('Set SUPABASE_URL, server-only SUPABASE_SECRET_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD before provisioning the Admin.')

const headers = { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }
const existing = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers })
if (!existing.ok) throw new Error(`Auth lookup failed: ${existing.status}`)
const users = await existing.json()
let authUser = users.users?.[0]
if (!authUser) {
  const created = await fetch(`${url}/auth/v1/admin/users`, { method: 'POST', headers, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: 'Nexus Administrator' } }) })
  if (!created.ok) throw new Error(`Auth user creation failed: ${created.status} ${await created.text()}`)
  authUser = await created.json()
}

const existingMemberResponse = await fetch(`${url}/rest/v1/members?email=eq.${encodeURIComponent(email)}&select=id`, { headers })
if (!existingMemberResponse.ok) throw new Error(`Admin member lookup failed: ${existingMemberResponse.status}`)
const existingMembers = await existingMemberResponse.json()
const memberPayload = { auth_user_id: authUser.id, role: 'admin', is_active: true, password: null, email, first_name: 'Nexus', last_name: 'Administrator', full_name: 'Nexus Administrator' }
const response = existingMembers[0]
  ? await fetch(`${url}/rest/v1/members?id=eq.${encodeURIComponent(existingMembers[0].id)}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(memberPayload) })
  : await fetch(`${url}/rest/v1/members`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ ...memberPayload, member_id: '1000000000', nexus_id: '1000000000' }) })
if (!response.ok) throw new Error(`Admin member link failed: ${response.status} ${await response.text()}`)
console.log(`Admin Auth user provisioned and linked: ${email}`)