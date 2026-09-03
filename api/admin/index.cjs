const fs = require('node:fs')
const path = require('node:path')
const { Client } = require('pg')

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body)
}

async function runDatabaseSync(adminPassword) {
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Database sync requires SUPABASE_DB_URL or DATABASE_URL in the Vercel production environment.')
  if (!adminPassword) throw new Error('Database sync requires the administrator password.')

  const connectionUrl = new URL(databaseUrl)
  connectionUrl.password = adminPassword

  const client = new Client({ connectionString: connectionUrl.toString(), ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    const schema = fs.readFileSync(path.join(process.cwd(), 'supabase-schema.sql'), 'utf8')
    await client.query(schema)
    const verification = await client.query(`
      with required_tables(table_name) as (
        values ('members'), ('profiles'), ('feed_posts'), ('chats'),
               ('chat_members'), ('messages'), ('support_messages')
      )
      select required_tables.table_name,
             to_regclass('public.' || required_tables.table_name) is not null as table_exists,
             coalesce(cls.relrowsecurity, false) as rls_enabled,
             count(columns.column_name) as column_count
      from required_tables
      left join pg_class cls on cls.oid = to_regclass('public.' || required_tables.table_name)
      left join information_schema.columns columns
        on columns.table_schema = 'public'
       and columns.table_name = required_tables.table_name
      group by required_tables.table_name, cls.relrowsecurity
      order by required_tables.table_name;

      select to_regprocedure('public.search_member_by_nexus_id(text)') as lookup_function,
             to_regprocedure('public.authenticate_member(text,text)') as authentication_function,
             exists (
               select 1 from pg_publication_tables
               where pubname = 'supabase_realtime'
                 and schemaname = 'public'
                 and tablename = 'feed_posts'
             ) as feed_posts_realtime;
    `)
    return `Schema applied and verified.\n${verification.rows.map((row) => JSON.stringify(row)).join('\n')}`
  } finally {
    await client.end().catch(() => {})
  }
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
      try {
        return json(res, 200, { output: await runDatabaseSync(req.body?.password) })
      } catch (error) {
        return json(res, 500, { error: `Database sync failed: ${error.message}` })
      }
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