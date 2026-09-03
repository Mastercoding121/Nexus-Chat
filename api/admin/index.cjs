const { spawn } = require('node:child_process')

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY

function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body)
}

async function requireAdmin(req) {
  if (!supabaseUrl || !publishableKey || !secretKey) throw Object.assign(new Error('Server Supabase credentials are not configured.'), { status: 503 })
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) throw Object.assign(new Error('Authentication required.'), { status: 401 })
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` } })
  if (!authResponse.ok) throw Object.assign(new Error('Invalid authentication session.'), { status: 401 })
  const authUser = await authResponse.json()
  const memberResponse = await fetch(`${supabaseUrl}/rest/v1/members?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=role,is_active`, { headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } })
  const members = await memberResponse.json()
  if (!memberResponse.ok || members[0]?.role !== 'admin' || members[0]?.is_active === false) throw Object.assign(new Error('Administrator access required.'), { status: 403 })
}

module.exports = async (req, res) => {
  try {
    await requireAdmin(req)
    const route = req.url.split('?')[0]
    if (route.endsWith('/db-sync') && req.method === 'POST') {
      const child = spawn('npm', ['run', 'db:apply'], { cwd: process.cwd(), env: process.env })
      let output = ''
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
      child.on('close', (code) => json(res, code === 0 ? 200 : 500, { error: code === 0 ? undefined : 'Database sync failed.', output: output.slice(-12000) }))
      return
    }
    const headers = { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
    const user = req.body?.user || {}
    if (route.endsWith('/users') && req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/members?select=id,member_id,nexus_id,first_name,last_name,full_name,email,role,avatar_url,is_active,created_at&order=created_at.desc`, { headers })
      return json(res, response.status, { users: await response.json() })
    }
    if (route.endsWith('/users') && ['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      const endpoint = req.method === 'POST' ? `${supabaseUrl}/rest/v1/members` : `${supabaseUrl}/rest/v1/members?id=eq.${encodeURIComponent(user.id)}`
      const payload = req.method === 'DELETE' ? undefined : {
        ...(req.method === 'POST' ? { member_id: user.member_id, nexus_id: user.member_id, password: null } : {}),
        first_name: user.first_name, last_name: user.last_name, full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email || null, role: user.role || 'user', is_active: user.is_active !== false,
      }
      const response = await fetch(endpoint, { method: req.method, headers: { ...headers, Prefer: 'return=minimal' }, ...(payload ? { body: JSON.stringify(payload) } : {}) })
      return json(res, response.ok ? 200 : response.status, { error: response.ok ? undefined : await response.text() })
    }
    return json(res, 404, { error: 'Not found.' })
  } catch (error) { return json(res, error.status || 500, { error: error.message || 'Request failed.' }) }
}