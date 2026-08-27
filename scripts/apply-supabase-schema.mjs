import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const schemaPath = resolve(projectRoot, 'supabase-schema.sql')

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(readFileSync(filePath, 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) return []
    return [[match[1], match[2].replace(/^['"]|['"]$/g, '')]]
  }))
}

const localEnv = {
  ...readEnvFile(resolve(projectRoot, '.env.local.txt')),
  ...readEnvFile(resolve(projectRoot, '.env.local')),
}
const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || localEnv.SUPABASE_DB_URL || localEnv.DATABASE_URL
const psqlPath = ['/usr/local/opt/libpq/bin/psql', '/opt/homebrew/opt/libpq/bin/psql', 'psql']
  .find((candidate) => candidate === 'psql' || existsSync(candidate))

function fail(message) {
  console.error(`Database migration failed: ${message}`)
  process.exitCode = 1
}

if (!existsSync(schemaPath)) {
  fail(`schema file not found at ${schemaPath}`)
} else if (!databaseUrl) {
  fail('set SUPABASE_DB_URL or DATABASE_URL in the terminal before running this script')
} else if (!psqlPath || spawnSync(psqlPath, ['--version'], { stdio: 'ignore' }).status !== 0) {
  fail('psql is not installed or is unavailable on PATH')
} else {
  try {
    console.log('Applying Supabase schema...')
    execFileSync(psqlPath, [databaseUrl, '--file', schemaPath, '--set', 'ON_ERROR_STOP=1'], {
      cwd: projectRoot,
      stdio: 'inherit',
    })

    console.log('Verifying Nexus ID columns and lookup function...')
    execFileSync(psqlPath, [
      databaseUrl,
      '--command',
      `select table_name, column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'members'
         and column_name in ('nexus_id', 'profile_id', 'avatar_url', 'is_active')
       order by column_name;
       select to_regprocedure('public.search_member_by_nexus_id(text)') as lookup_function;`,
    ], { cwd: projectRoot, stdio: 'inherit' })

    console.log('Supabase schema applied successfully.')
  } catch (error) {
    fail(`psql exited with code ${error.status ?? 'unknown'}`)
  }
}
