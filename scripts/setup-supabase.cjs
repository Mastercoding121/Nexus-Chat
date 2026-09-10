/* =============================================================================
 * Nexus Chat - Supabase Database Initialization Script
 * =============================================================================
 *
 * USAGE
 *   node scripts/setup-supabase.cjs [options]
 *
 *   npm run db:setup          -- Normal execution (schema + admin + verify)
 *   npm run db:setup:dry      -- Dry run: print actions, no writes
 *   npm run db:verify         -- Verify-only: check admin state, skip setup
 *
 * OPTIONS
 *   --dry-run      Print planned operations without executing any writes
 *   --verify-only  Skip setup steps, only run verification queries
 *   --verbose      Enable extra debug output (config dump, SQL statements)
 *   -h, --help     Show this help message
 *
 * REQUIRED ENVIRONMENT VARIABLES
 *   SUPABASE_URL             URL of your Supabase project (e.g. https://xxx.supabase.co)
 *                            Falls back to VITE_SUPABASE_URL if present
 *   SUPABASE_SERVICE_ROLE_KEY Service-role key with bypass_rls privilege
 *                            Used for DDL, admin provisioning, and verification
 *
 * OPTIONAL ENVIRONMENT VARIABLES
 *   DATABASE_URL             Direct Postgres connection string (RECOMMENDED for DDL)
 *                            Format: postgresql://user:pass@host:port/dbname
 *                            Supabase Cloud: Dashboard → Project Settings → Database → Connection string
 *                            Local CLI:     postgresql://postgres:postgres@127.0.0.1:54322/postgres
 *                            Falls back to SUPABASE_DB_URL if present
 *   VITE_SUPABASE_ANON_KEY   Public anon key (used only for RLS verification tests)
 *   SUPABASE_DB_HOST         Postgres host override (derived from SUPABASE_URL if not set)
 *   SUPABASE_DB_PORT         Postgres port (default 5432, local CLI uses 54322)
 *   SUPABASE_DB_USER         Postgres user (default postgres)
 *   SUPABASE_DB_NAME         Postgres database name (default postgres)
 *   SUPABASE_DB_PASSWORD     Postgres password (local CLI default: postgres)
 *   ADMIN_EMAIL              Override admin email address
 *                              Default: elonmuskite@gmail.com
 *   ADMIN_PASSWORD           Override admin password
 *                              Default: Jagaban@1
 *   ADMIN_MEMBER_ID          Override admin member_id
 *                              Default: 1000000000
 *   NODE_ENV                 local | staging | production (affects log output)
 *                              Default: local
 *   MIGRATION_MODE           Force migration backend: pg | cli | rest
 *                              Default: auto-detect (pg first, then cli, then rest)
 *
 * EXAMPLE .env FILE SNIPPET
 *   # Supabase project configuration
 *   SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *   # Direct Postgres connection (RECOMMENDED for DDL)
 *   DATABASE_URL=postgresql://postgres:YOUR_DB_PASS@db.xxxxxxxxxxxxxxxx.supabase.co:5432/postgres
 *   # Admin overrides (optional)
 *   # ADMIN_EMAIL=admin@yourdomain.com
 *   # ADMIN_PASSWORD=YourSecureP@ss1
 *   NODE_ENV=local
 *
 * EXIT CODES
 *   0  SUCCESS   Setup complete / admin already provisioned / verification passed
 *   1  CONFIG    Missing required env vars or invalid credential format
 *   2  CONNECT   Database connection failure (wrong URL, network, DNS, TLS)
 *   3  PERM      Permission error: service_role key required, anon key insufficient
 *   4  CONFLICT  Unique constraint violation on admin email (race condition)
 *   5  SQL       SQL syntax error or migration execution failure
 *   6  VERIFY    Post-setup verification checks failed
 *
 * TROUBLESHOOTING
 *   Exit 1 (CONFIG):
 *     - Check that a .env file exists at the project root or vars are exported
 *     - Confirm SUPABASE_URL includes protocol (https://) and no trailing /rest/v1
 *     - Ensure SUPABASE_SERVICE_ROLE_KEY starts with "eyJ..." (JWT format)
 *     - Password must be >= 8 chars, mixed case, 1 digit, 1 special char
 *
 *   Exit 2 (CONNECT):
 *     - Verify DATABASE_URL is correct (postgresql:// format, correct host/port/password)
 *     - For local Supabase CLI: ensure `supabase start` is running (DB port is usually 54322, not 5432)
 *     - Ping the SUPABASE_URL / DATABASE_URL host from your terminal: `ping x.supabase.co`
 *     - Check corporate proxy / VPN settings; some networks block outbound Postgres 5432
 *     - SSL: cloud Supabase requires SSL; local CLI usually does not (add ?sslmode=disable if needed)
 *     - If no DATABASE_URL: install pg (`npm i -D pg`) and provide URL, or use `supabase db push` CLI
 *
 *   Exit 3 (PERM):
 *     - You used the PUBLISHABLE / anon key. Retrieve the SERVICE_ROLE key from:
 *       Supabase Dashboard → Project Settings → API → Project API keys → service_role
 *     - The service_role key MUST be kept server-side only, NEVER commit to git
 *
 *   Exit 4 (CONFLICT):
 *     - Concurrent admin provisioning race; retry with 1s exponential backoff
 *     - If persistent, manually inspect `members` table for duplicate admin rows
 *
 *   Exit 5 (SQL):
 *     - Review supabase-schema.sql for syntax errors (use `--verbose` to see last statement)
 *     - Confirm schema file is not corrupted or modified with invalid Postgres syntax
 *     - Check Postgres version: Supabase Cloud uses PG15+, local CLI may vary
 *     - If using MIGRATION_MODE=rest: DDL execution requires exec_sql function;
 *       prefer MIGRATION_MODE=pg (with DATABASE_URL) for full DDL support
 *
 *   Exit 6 (VERIFY):
 *     - Re-run with `--verbose` to see which of the 3 verification checks failed
 *     - Common causes: RLS policy too restrictive / schema file not fully executed
 * =============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

const EXIT = {
  OK: 0,
  CONFIG: 1,
  CONNECT: 2,
  PERM: 3,
  CONFLICT: 4,
  SQL: 5,
  VERIFY: 6,
};

const DEFAULTS = {
  ADMIN_EMAIL: 'elonmuskite@gmail.com',
  ADMIN_PASSWORD: 'Jagaban@1',
  ADMIN_MEMBER_ID: '1000000000',
  NODE_ENV: 'local',
};

function parseArgs(argv) {
  const args = { dryRun: false, verifyOnly: false, verbose: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verify-only') args.verifyOnly = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a === '-h' || a === '--help') args.help = true;
  }
  return args;
}

function printHelp() {
  const header = fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 80).join('\n');
  process.stdout.write(header + '\n');
}

function projectRoot() {
  return path.resolve(__dirname, '..');
}

function loadDotEnv(root) {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx < 0) return;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    });
  } catch (e) {
    process.stderr.write(`[warn] could not read .env file: ${e.message}\n`);
  }
}

function getEnv(key, fallback) {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
}

function loadConfig() {
  const root = projectRoot();
  loadDotEnv(root);
  const migrationMode = (getEnv('MIGRATION_MODE') || 'auto').toLowerCase();
  const forceMode = ['pg', 'cli', 'rest'].includes(migrationMode) ? migrationMode : 'auto';
  const rawDbUrl = getEnv('DATABASE_URL') || getEnv('SUPABASE_DB_URL') || '';
  let derivedDbUrl = rawDbUrl;
  if (!derivedDbUrl) {
    const host = getEnv('SUPABASE_DB_HOST') || '';
    const port = getEnv('SUPABASE_DB_PORT') || '';
    const user = getEnv('SUPABASE_DB_USER') || 'postgres';
    const dbname = getEnv('SUPABASE_DB_NAME') || 'postgres';
    const pw = getEnv('SUPABASE_DB_PASSWORD') || '';
    if (host) {
      derivedDbUrl = `postgresql://${user}${pw ? ':' + encodeURIComponent(pw) : ''}@${host}${port ? ':' + port : ''}/${dbname}`;
    }
  }
  const supabaseHost = (getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return {
    projectRoot: root,
    supabaseUrl: getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || '',
    supabaseHost,
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY') || '',
    anonKey: getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || '',
    databaseUrl: derivedDbUrl,
    migrationMode: forceMode,
    adminEmail: getEnv('ADMIN_EMAIL', DEFAULTS.ADMIN_EMAIL),
    adminPassword: getEnv('ADMIN_PASSWORD', DEFAULTS.ADMIN_PASSWORD),
    adminMemberId: getEnv('ADMIN_MEMBER_ID', DEFAULTS.ADMIN_MEMBER_ID),
    nodeEnv: getEnv('NODE_ENV', DEFAULTS.NODE_ENV),
  };
}

function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email || '').trim());
}

function validatePassword(pw) {
  const s = String(pw || '');
  if (s.length < 8) return 'minimum 8 characters';
  if (!/[A-Z]/.test(s)) return 'at least one uppercase letter';
  if (!/[a-z]/.test(s)) return 'at least one lowercase letter';
  if (!/[0-9]/.test(s)) return 'at least one digit';
  if (!/[^A-Za-z0-9]/.test(s)) return 'at least one special character';
  return null;
}

function validateConfig(cfg) {
  const errors = [];
  if (!cfg.supabaseUrl) {
    errors.push('SUPABASE_URL is required (set env var or add to .env)');
  } else if (!/^https?:\/\//.test(cfg.supabaseUrl)) {
    errors.push('SUPABASE_URL must start with http:// or https://');
  }
  if (!cfg.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required (anon key does not have DDL privileges)');
  }
  if (!validateEmail(cfg.adminEmail)) {
    errors.push(`ADMIN_EMAIL format invalid: "${cfg.adminEmail}"`);
  }
  const pwErr = validatePassword(cfg.adminPassword);
  if (pwErr) {
    errors.push(`ADMIN_PASSWORD invalid: ${pwErr}`);
  }
  return errors;
}

function logConfigSummary(cfg, verbose) {
  process.stdout.write(`[config] NODE_ENV=${cfg.nodeEnv}\n`);
  process.stdout.write(`[config] SUPABASE_URL=${cfg.supabaseUrl}\n`);
  process.stdout.write(`[config] migrationMode=${cfg.migrationMode} (auto-detect: pg→cli→rest)\n`);
  process.stdout.write(`[config] DATABASE_URL: ${cfg.databaseUrl ? cfg.databaseUrl.replace(/:([^:@]+)@/, ':***@').slice(0, 70) + '...' : '(not set — falling back to CLI or REST mode)'}\n`);
  process.stdout.write(`[config] service_role key: ${cfg.serviceRoleKey ? cfg.serviceRoleKey.slice(0, 10) + '... (loaded)' : 'MISSING'}\n`);
  process.stdout.write(`[config] admin email: ${cfg.adminEmail}\n`);
  process.stdout.write(`[config] admin member_id: ${cfg.adminMemberId}\n`);
  if (verbose) {
    process.stdout.write(`[config] project root: ${cfg.projectRoot}\n`);
    process.stdout.write(`[config] anon key: ${cfg.anonKey ? cfg.anonKey.slice(0, 10) + '... (loaded)' : '(not provided - RLS tests skipped)'}\n`);
  }
}

function classifyError(err) {
  const msg = String(err && (err.message || err.msg || err));
  const code = String(err && (err.code || ''));
  const details = String(err && err.details || '');

  if (/unique|duplicate.*(email|idx_members_email|23505)/i.test(msg + ' ' + code + ' ' + details) || code === '23505') {
    return { code: EXIT.CONFLICT, label: 'CONFLICT', hint: 'Unique constraint on admin email; retry or manually inspect members table.' };
  }
  if (/permission|privilege|denied|42501|must be owner|not authorized|401|403/i.test(msg + ' ' + code)) {
    return { code: EXIT.PERM, label: 'PERM', hint: 'Service role key required. Do not use anon/publishable key for DDL.' };
  }
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network|fetch|timeout|tls|certificate|unable to resolve/i.test(msg)) {
    return { code: EXIT.CONNECT, label: 'CONNECT', hint: 'Cannot reach Supabase. Check URL, network, local supabase start status.' };
  }
  if (/syntax|parse error|invalid input|relation.*does not exist|column.*does not exist|42601|42P01|42703/i.test(msg + ' ' + code)) {
    return { code: EXIT.SQL, label: 'SQL', hint: 'Migration syntax error. Re-run with --verbose to identify last statement.' };
  }
  if (/jwt|invalid.*key|signature|Could not verify/i.test(msg)) {
    return { code: EXIT.PERM, label: 'PERM', hint: 'JWT validation failed. Confirm service_role key is current (Dashboard → API settings).' };
  }
  return null;
}

function fail(classified, rawErr, verbose) {
  const { code, label, hint } = classified || { code: EXIT.VERIFY, label: 'UNKNOWN', hint: 'See error message above.' };
  process.stderr.write(`\n[error:${label}] (exit ${code}) ${hint}\n`);
  if (rawErr && (verbose || code === EXIT.SQL || code === EXIT.CONNECT)) {
    const stack = rawErr && rawErr.stack ? rawErr.stack : String(rawErr);
    process.stderr.write(`[detail]\n${stack}\n`);
  }
  process.exit(code);
}

async function createSupabaseClient(cfg, { anon = false } = {}) {
  const key = anon ? cfg.anonKey : cfg.serviceRoleKey;
  const url = cfg.supabaseUrl;
  if (!key) return null;
  try {
    const mod = await import('@supabase/supabase-js');
    const opts = {
      auth: { persistSession: false, autoRefreshToken: false },
      global: anon ? {} : { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    };
    return mod.createClient(url, key, opts);
  } catch (e) {
    fail({ code: EXIT.CONNECT, label: 'CONNECT', hint: 'Unable to load @supabase/supabase-js. Run `npm install`.' }, e, true);
    return null;
  }
}

async function testConnection(client, verbose) {
  try {
    const { data, error } = await client.from('members').select('count', { count: 'exact', head: true });
    if (error) throw error;
    if (verbose) process.stdout.write(`[connect] health check succeeded (members table reachable)\n`);
    return true;
  } catch (e) {
    const c = classifyError(e) || { code: EXIT.CONNECT, label: 'CONNECT', hint: 'Supabase connection health check failed.' };
    fail(c, e, verbose);
    return false;
  }
}

function splitSqlStatements(sql) {
  const out = [];
  let i = 0;
  const n = sql.length;
  let buf = '';
  while (i < n) {
    const ch = sql[i];
    if (ch === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (ch === '$' && /^\$[a-zA-Z0-9_]*\$/.test(sql.slice(i))) {
      const tagMatch = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        const closeIdx = sql.indexOf(tag, i + tag.length);
        if (closeIdx < 0) {
          buf += sql.slice(i);
          i = n;
          continue;
        }
        buf += sql.slice(i, closeIdx + tag.length);
        i = closeIdx + tag.length;
        continue;
      }
    }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      buf += ch;
      i++;
      while (i < n) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) { buf += quote + quote; i += 2; continue; }
          buf += quote; i++; break;
        }
        buf += sql[i]; i++;
      }
      continue;
    }
    if (ch === ';') {
      const trimmed = buf.trim();
      if (trimmed) out.push(trimmed);
      buf = '';
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  const last = buf.trim();
  if (last) out.push(last);
  return out;
}

function tryRequirePg() {
  try {
    return require('pg');
  } catch (_) {
    return null;
  }
}

function commandExists(cmd) {
  const { execSync } = require('child_process');
  try {
    if (process.platform === 'win32') {
      execSync(`where.exe ${cmd}`, { stdio: 'ignore', timeout: 5000 });
    } else {
      execSync(`command -v ${cmd}`, { stdio: 'ignore', timeout: 5000 });
    }
    return true;
  } catch (_) {
    return false;
  }
}

function resolveMigrationBackend(cfg) {
  const desired = cfg.migrationMode;
  const pgAvailable = cfg.databaseUrl && !!tryRequirePg();
  const cliAvailable = commandExists('supabase');
  const candidates = [];
  if (desired === 'auto') {
    if (pgAvailable) candidates.push('pg');
    if (cliAvailable) candidates.push('cli');
    candidates.push('rest');
  } else {
    candidates.push(desired);
  }
  return candidates[0] || 'rest';
}

async function runMigrationsViaPg(cfg, sqlText, statements, opts) {
  const { verbose } = opts;
  const pg = tryRequirePg();
  if (!pg) throw new Error('pg driver not available; run `npm i -D pg` and provide DATABASE_URL');
  const { Client } = pg;
  const client = new Client({ connectionString: cfg.databaseUrl, ssl: cfg.nodeEnv !== 'local' ? { rejectUnauthorized: false } : false });
  try {
    await client.connect();
  } catch (e) {
    const c = classifyError(e) || { code: EXIT.CONNECT, label: 'CONNECT', hint: 'Could not connect to Postgres via DATABASE_URL.' };
    fail(c, e, verbose);
  }
  process.stdout.write(`[migrate:pg] connected to Postgres (${cfg.databaseUrl.replace(/:([^:@]+)@/, ':***@').slice(0, 60)}...)\n`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (verbose) {
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 140);
      process.stdout.write(`[migrate:pg:${i + 1}/${statements.length}] ${preview}${stmt.length > 140 ? '...' : ''}\n`);
    }
    try {
      await client.query(stmt);
    } catch (e) {
      const c = classifyError(e) || { code: EXIT.SQL, label: 'SQL', hint: `Statement ${i + 1} failed. Use --verbose for preview.` };
      try { await client.end(); } catch (_) {}
      fail(c, e, verbose);
    }
  }
  try { await client.end(); } catch (_) {}
  process.stdout.write(`[migrate:pg] executed ${statements.length} statement(s) successfully\n`);
  return true;
}

async function runMigrationsViaCli(cfg, schemaPath, opts) {
  const { verbose } = opts;
  const { execFile } = require('child_process');
  const args = ['db', 'push', '--db-url', cfg.databaseUrl || '', '-f', schemaPath];
  process.stdout.write(`[migrate:cli] invoking: supabase db push ...\n`);
  return new Promise((resolve, reject) => {
    const child = execFile('supabase', args, { cwd: cfg.projectRoot, timeout: 120000 }, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr && verbose) process.stderr.write(`[cli:stderr] ${stderr}\n`);
      if (err) {
        const c = classifyError(err) || { code: EXIT.SQL, label: 'SQL', hint: '`supabase db push` failed.' };
        fail(c, new Error(`${err.message}\nCLI stdout: ${stdout}\nCLI stderr: ${stderr}`), verbose);
        return reject(err);
      }
      process.stdout.write(`[migrate:cli] supabase db push completed\n`);
      resolve(true);
    });
  });
}

async function runMigrationsViaRest(client, statements, opts) {
  const { verbose } = opts;
  process.stdout.write(`[migrate:rest] REST mode: attempting to apply DDL via exec_sql RPC.\n`);
  process.stdout.write(`[migrate:rest] NOTE: REST mode works only AFTER exec_sql() bootstrapped; prefer MIGRATION_MODE=pg with DATABASE_URL.\n`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (verbose) {
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 140);
      process.stdout.write(`[migrate:rest:${i + 1}/${statements.length}] ${preview}${stmt.length > 140 ? '...' : ''}\n`);
    }
    try {
      const { error } = await client.rpc('exec_sql', { sql_query: stmt });
      if (error) throw error;
    } catch (e) {
      const msg = String(e && e.message || e);
      if (/function (public\.)?exec_sql|does not exist|RPC/i.test(msg)) {
        process.stderr.write(`[migrate:rest:warning] exec_sql() RPC not available. Applying DDL via REST requires a pre-existing SECURITY DEFINER exec_sql function.\n`);
        process.stderr.write(`[migrate:rest:hint] For first-time provisioning, use MIGRATION_MODE=pg (with DATABASE_URL) or apply supabase-schema.sql manually via Supabase SQL Editor, then re-run script for admin provisioning.\n`);
        const c = { code: EXIT.SQL, label: 'SQL', hint: 'REST mode cannot bootstrap DDL. Switch to MIGRATION_MODE=pg with DATABASE_URL or run schema file manually in SQL Editor first.' };
        fail(c, e, verbose);
        return false;
      }
      const c = classifyError(e) || { code: EXIT.SQL, label: 'SQL', hint: `Statement ${i + 1} failed via exec_sql RPC.` };
      fail(c, e, verbose);
      return false;
    }
  }
  process.stdout.write(`[migrate:rest] executed ${statements.length} statement(s) via RPC\n`);
  return true;
}

async function runMigrations(client, cfg, schemaPath, opts) {
  const { dryRun, verbose } = opts;
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitSqlStatements(raw);
  process.stdout.write(`[migrate] loaded ${statements.length} SQL statement(s) from ${path.relative(projectRoot(), schemaPath)}\n`);

  if (dryRun) {
    process.stdout.write(`[migrate] --dry-run enabled; would execute ${statements.length} statement(s):\n`);
    statements.forEach((s, i) => {
      const preview = s.replace(/\s+/g, ' ').slice(0, 100);
      process.stdout.write(`  [${i + 1}] ${preview}${s.length > 100 ? '...' : ''}\n`);
    });
    return true;
  }

  const backend = resolveMigrationBackend(cfg);
  process.stdout.write(`[migrate] using backend: ${backend} (mode: ${cfg.migrationMode})\n`);
  if (backend === 'pg') return runMigrationsViaPg(cfg, raw, statements, opts);
  if (backend === 'cli') return runMigrationsViaCli(cfg, schemaPath, opts);
  return runMigrationsViaRest(client, statements, opts);
}

async function provisionAdmin(client, cfg, opts) {
  const { dryRun, verbose } = opts;
  const adminPayload = {
    member_id: cfg.adminMemberId,
    email: cfg.adminEmail,
    first_name: 'System',
    last_name: 'Administrator',
    full_name: 'System Administrator',
    password: cfg.adminPassword,
    role: 'supabase_admin',
    email_verified: true,
  };

  process.stdout.write(`[provision] checking for existing admin by email="${cfg.adminEmail}" OR member_id="${cfg.adminMemberId}"\n`);

  let existing = null;
  try {
    const { data, error } = await client
      .from('members')
      .select('id, member_id, email, role, email_verified, full_name')
      .or(`email.eq.${cfg.adminEmail},member_id.eq.${cfg.adminMemberId}`)
      .limit(1);
    if (error) throw error;
    existing = data && data[0] ? data[0] : null;
  } catch (e) {
    const c = classifyError(e) || { code: EXIT.VERIFY, label: 'VERIFY', hint: 'Could not query members table to check for admin.' };
    fail(c, e, verbose);
  }

  if (existing) {
    process.stdout.write(`[provision] admin already exists (id=${existing.id}, role=${existing.role}) — skipping insert (idempotent)\n`);
    if (verbose) process.stdout.write(`[provision] existing record: ${JSON.stringify(existing)}\n`);
    return { created: false, record: existing };
  }

  if (dryRun) {
    process.stdout.write(`[provision] --dry-run enabled; would INSERT admin:\n`);
    const { password, ...preview } = adminPayload;
    process.stdout.write(`  ${JSON.stringify(preview)}\n`);
    return { created: false, record: null };
  }

  process.stdout.write(`[provision] creating admin user with email="${cfg.adminEmail}"\n`);
  try {
    const { data, error } = await client
      .from('members')
      .insert(adminPayload)
      .select('id, member_id, email, role, email_verified, full_name')
      .single();
    if (error) throw error;
    process.stdout.write(`[provision] admin created successfully (id=${data && data.id})\n`);
    return { created: true, record: data };
  } catch (e) {
    const c = classifyError(e) || { code: EXIT.SQL, label: 'SQL', hint: 'Admin insert failed unexpectedly.' };
    fail(c, e, verbose);
    return { created: false, record: null };
  }
}

async function verifySetup(client, cfg, opts) {
  const { verbose } = opts;
  process.stdout.write(`[verify] running post-setup verification checks...\n`);
  const checks = [];

  let adminRow = null;
  try {
    const { data, error } = await client
      .from('members')
      .select('id, member_id, email, role, email_verified, full_name')
      .eq('email', cfg.adminEmail)
      .maybeSingle();
    if (error) throw error;
    adminRow = data || null;
  } catch (e) {
    const c = classifyError(e) || { code: EXIT.VERIFY, label: 'VERIFY', hint: 'Verification query for admin row failed.' };
    fail(c, e, verbose);
  }

  checks.push({
    name: 'admin row exists',
    pass: !!adminRow,
    detail: adminRow ? `found id=${adminRow.id}` : 'no row returned for admin email',
  });
  checks.push({
    name: 'admin role = supabase_admin',
    pass: adminRow && adminRow.role === 'supabase_admin',
    detail: adminRow ? `role=${adminRow.role}` : '(no row)',
  });
  checks.push({
    name: 'admin email_verified = true',
    pass: adminRow && adminRow.email_verified === true,
    detail: adminRow ? `email_verified=${adminRow.email_verified}` : '(no row)',
  });
  checks.push({
    name: 'admin member_id correct',
    pass: adminRow && adminRow.member_id === cfg.adminMemberId,
    detail: adminRow ? `member_id=${adminRow.member_id}` : '(no row)',
  });

  let adminCount = 0;
  try {
    const { count, error } = await client
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'supabase_admin');
    if (error) throw error;
    adminCount = Number(count || 0);
  } catch (e) {
    process.stderr.write(`[verify:warning] could not count admin rows: ${e.message}\n`);
  }
  checks.push({
    name: 'exactly one supabase_admin exists',
    pass: adminCount === 1,
    detail: `count=${adminCount}`,
  });

  if (cfg.anonKey) {
    const anonClient = await createSupabaseClient(cfg, { anon: true });
    if (anonClient) {
      try {
        const { data, error } = await anonClient
          .from('members')
          .select('id, email, role')
          .eq('email', cfg.adminEmail);
        if (error && verbose) process.stderr.write(`[verify:anon:debug] ${error.message}\n`);
        const visible = Array.isArray(data) ? data.length : 0;
        checks.push({
          name: 'anon-key SELECT on admin email returns empty (RLS enforced)',
          pass: visible === 0,
          detail: `anon query returned ${visible} row(s)`,
        });
      } catch (e) {
        checks.push({
          name: 'anon-key SELECT on admin email returns empty (RLS enforced)',
          pass: false,
          detail: `anon client error: ${e.message}`,
        });
      }

      try {
        const { data, error } = await anonClient
          .from('members')
          .select('email, password')
          .neq('role', 'supabase_admin')
          .limit(1);
        if (verbose && error) process.stderr.write(`[verify:acl:debug] anon password select error=${error && error.message}\n`);
        const rows = Array.isArray(data) ? data : [];
        const anyPasswordExposed = rows.some((r) => r && 'password' in r && r.password !== null && r.password !== undefined);
        const aclBlocked = Boolean(error) || !anyPasswordExposed;
        checks.push({
          name: 'anon-key SELECT password column blocked (column ACL REVOKE enforced)',
          pass: aclBlocked,
          detail: error
            ? `anon blocked with error: ${error.message}`
            : anyPasswordExposed
              ? `WARNING: password column visible for ${rows.length} row(s)`
              : `rows=${rows.length}, no password values exposed`,
        });
      } catch (e) {
        checks.push({
          name: 'anon-key SELECT password column blocked (column ACL REVOKE enforced)',
          pass: true,
          detail: `anon password select errored (ACL enforced): ${e.message}`,
        });
      }
    }
  } else {
    checks.push({
      name: 'anon-key RLS enforcement test SKIPPED (no VITE_SUPABASE_ANON_KEY)',
      pass: true,
      detail: 'provide anon key to enable this verification check',
    });
    checks.push({
      name: 'anon-key SELECT password column blocked test SKIPPED (no VITE_SUPABASE_ANON_KEY)',
      pass: true,
      detail: 'provide anon key to enable column-ACL verification check',
    });
  }

  let allPassed = true;
  checks.forEach((c, i) => {
    const mark = c.pass ? '✓' : '✗';
    if (!c.pass) allPassed = false;
    process.stdout.write(`  [${i + 1}] ${mark} ${c.name} — ${c.detail}\n`);
  });

  if (!allPassed) {
    process.stderr.write(`[verify] one or more verification checks failed\n`);
    process.exit(EXIT.VERIFY);
  }
  process.stdout.write(`[verify] all checks passed ✓\n`);
  return true;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(EXIT.OK);
  }

  const cfg = loadConfig();
  if (args.verbose) logConfigSummary(cfg, true);
  else logConfigSummary(cfg, false);

  const validationErrors = validateConfig(cfg);
  if (validationErrors.length) {
    process.stderr.write(`[error:CONFIG] (exit ${EXIT.CONFIG}) Invalid configuration:\n`);
    validationErrors.forEach(m => process.stderr.write(`  - ${m}\n`));
    process.stderr.write(`  Remediation: see header comment in this script (top of ${path.basename(__filename)})\n`);
    process.exit(EXIT.CONFIG);
  }
  process.stdout.write(`[config] all validations passed ✓\n`);

  const client = await createSupabaseClient(cfg);
  if (!client) {
    fail({ code: EXIT.CONNECT, label: 'CONNECT', hint: 'Failed to instantiate Supabase client.' }, new Error('client init failed'), args.verbose);
  }

  if (!args.dryRun) {
    await testConnection(client, args.verbose);
  }

  const schemaPath = path.join(cfg.projectRoot, 'supabase-schema.sql');
  if (!fs.existsSync(schemaPath)) {
    fail({ code: EXIT.CONFIG, label: 'CONFIG', hint: `Schema file missing: ${schemaPath}` }, new Error('schema not found'), args.verbose);
  }

  if (!args.verifyOnly) {
    await runMigrations(client, cfg, schemaPath, { dryRun: args.dryRun, verbose: args.verbose });
    await provisionAdmin(client, cfg, { dryRun: args.dryRun, verbose: args.verbose });
  } else {
    process.stdout.write(`[verify-only] skipping migration + admin provisioning\n`);
  }

  if (!args.dryRun) {
    await verifySetup(client, cfg, { verbose: args.verbose });
  } else {
    process.stdout.write(`[dry-run] skipping verification (no writes executed)\n`);
  }

  process.stdout.write(`\n[done] setup-supabase.cjs finished with exit 0 ✓\n`);
  process.exit(EXIT.OK);
}

main().catch((err) => {
  const c = classifyError(err) || { code: EXIT.VERIFY, label: 'UNCAUGHT', hint: 'Unhandled script error. Re-run with --verbose for stack trace.' };
  fail(c, err, true);
});
