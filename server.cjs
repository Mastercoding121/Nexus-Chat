
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = process.cwd()
const port = Number(process.env.PORT || 8000)
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }

function loadLocalEnv() {
  for (const file of ['.env', '.env.local']) {
    if (!fs.existsSync(path.join(root, file))) continue
    for (const line of fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  }
}

loadLocalEnv()
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk; if (body.length > 1000000) reject(new Error('Request too large')) })
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}) } catch { reject(new Error('Invalid JSON')) } })
    req.on('error', reject)
  })
}

async function requireAdmin(req) {
  if (!supabaseUrl || !publishableKey || !secretKey) throw Object.assign(new Error('Server Supabase credentials are not configured.'), { status: 503 })
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) throw Object.assign(new Error('Authentication required.'), { status: 401 })
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` } })
  if (!authResponse.ok) throw Object.assign(new Error('Invalid authentication session.'), { status: 401 })
  const authUser = await authResponse.json()
  const memberResponse = await fetch(`${supabaseUrl}/rest/v1/members?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=id,role,is_active`, { headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } })
  const members = await memberResponse.json()
  if (!memberResponse.ok || members[0]?.role !== 'admin' || members[0]?.is_active === false) throw Object.assign(new Error('Administrator access required.'), { status: 403 })
  return { authUser, token }
}

async function handleApi(req, res) {
  try {
    await requireAdmin(req)
    const body = await readBody(req)
    const headers = { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
    if (req.url === '/api/admin/db-sync' && req.method === 'POST') {
      const child = spawn('npm', ['run', 'db:apply'], { cwd: root, env: process.env })
      let output = ''
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
      child.on('close', (code) => json(res, code === 0 ? 200 : 500, { error: code === 0 ? undefined : 'Database sync failed.', output: output.slice(-12000) }))
      return
    }
    if (req.url === '/api/admin/users' && req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/members?select=id,member_id,nexus_id,first_name,last_name,full_name,email,role,avatar_url,is_active,created_at&order=created_at.desc`, { headers })
      return json(res, response.status, { users: await response.json() })
    }
    if (req.url === '/api/admin/users' && ['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      const user = body.user || {}
      const endpoint = req.method === 'POST' ? `${supabaseUrl}/rest/v1/members` : `${supabaseUrl}/rest/v1/members?id=eq.${encodeURIComponent(user.id)}`
      const payload = req.method === 'DELETE' ? undefined : {
        ...(req.method === 'POST' ? { member_id: user.member_id, nexus_id: user.member_id, password: user.user_password } : {}),
        first_name: user.first_name, last_name: user.last_name, full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email || null, role: user.role || 'user', is_active: user.is_active !== false,
        ...(user.user_password ? { password: user.user_password } : {}),
      }
      const response = await fetch(endpoint, { method: req.method, headers: { ...headers, Prefer: 'return=minimal' }, ...(payload ? { body: JSON.stringify(payload) } : {}) })
      return json(res, response.ok ? 200 : response.status, { error: response.ok ? undefined : await response.text() })
    }
    return json(res, 404, { error: 'Not found.' })
  } catch (error) { return json(res, error.status || 500, { error: error.message || 'Request failed.' }) }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return handleApi(req, res)
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const filePath = path.join(root, 'dist', requested)
  const safePath = filePath.startsWith(path.join(root, 'dist')) ? filePath : path.join(root, 'dist', 'index.html')
  fs.readFile(safePath, (error, content) => {
    if (error) return fs.readFile(path.join(root, 'dist', 'index.html'), (fallbackError, fallback) => {
      if (fallbackError) return json(res, 404, { error: 'Build not found. Run npm run build.' })
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }); res.end(fallback)
    })
    const ext = path.extname(safePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' }); res.end(content)
  })
})

server.listen(port, () => console.log(`Nexus Chat server running at http://localhost:${port}`))
