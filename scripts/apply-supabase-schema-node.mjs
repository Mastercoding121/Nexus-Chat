import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'

const projectRoot = resolve(new URL('..', import.meta.url).pathname)

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(readFileSync(filePath, 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) return []
    return [[match[1], match[2].replace(/^['"]|['"]$/g, '')]]
  }))
}

const fileEnv = { ...readEnvFile(resolve(projectRoot, '.env')), ...readEnvFile(resolve(projectRoot, '.env.local')) }
const databaseUrl = fileEnv.SUPABASE_DB_URL || fileEnv.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
const adminPassword = fileEnv.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

if (!databaseUrl) throw new Error('set SUPABASE_DB_URL or DATABASE_URL before running this script')

const connectionUrl = new URL(databaseUrl)
if (adminPassword) connectionUrl.password = adminPassword
const client = new Client({ connectionString: connectionUrl.toString(), ssl: { rejectUnauthorized: false } })
const schema = readFileSync(resolve(projectRoot, 'supabase-schema.sql'), 'utf8')

try {
  await client.connect()
  console.log('Applying Supabase schema...')
  await client.query(schema)
  console.log('Verifying application tables, security, and lookup function...')
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
           has_function_privilege('anon', 'public.authenticate_member(text,text)', 'EXECUTE') as anon_can_authenticate,
           has_table_privilege('anon', 'public.members', 'SELECT') as anon_can_read_members,
           exists (
             select 1 from pg_publication_tables
             where pubname = 'supabase_realtime'
               and schemaname = 'public'
               and tablename = 'feed_posts'
           ) as feed_posts_realtime;
  `)
  console.table(verification.rows)
  console.log('Supabase schema applied successfully.')
} finally {
  await client.end().catch(() => {})
}
