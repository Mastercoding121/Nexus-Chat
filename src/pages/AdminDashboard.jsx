import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { databases, isAppwriteConfigured, canManageAppwriteSchema, getAppwriteConfig, APPWRITE_DATABASE_ID, Query } from '../lib/appwrite'
import { NEXUS_COLLECTIONS } from '../lib/appwriteSchema'
import { inspectAppwriteSchema, syncAppwriteSchema, verifyAppwriteSetup } from '../lib/appwriteProvision'
import Header from '../components/Header'
import BottomNav from '../components/chat/BottomNav'
import AppTopNav from '../components/chat/AppTopNav'
import NotificationStack from '../components/chat/NotificationStack'

function statusTone(ok) {
  return ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeUsers, setActiveUsers] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [schemaBusy, setSchemaBusy] = useState(false)
  const [schemaError, setSchemaError] = useState('')
  const [schemaResult, setSchemaResult] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const config = useMemo(() => getAppwriteConfig(), [])

  useEffect(() => {
    const loadAdminData = async () => {
      if (!isAppwriteConfigured() || !databases) {
        setError('Appwrite is not configured. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID.')
        setLoading(false)
        return
      }

      try {
        const [users, messages] = await Promise.all([
          databases.listDocuments(APPWRITE_DATABASE_ID, 'members', [
            Query.orderDesc('created_at'),
            Query.limit(20),
          ]),
          databases.listDocuments(APPWRITE_DATABASE_ID, 'messages', [
            Query.orderDesc('created_at'),
            Query.limit(20),
          ]),
        ])

        setActiveUsers(users.documents || [])
        setRecentMessages(messages.documents || [])
      } catch (err) {
        setError(err?.message || 'Failed to load admin data.')
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  useEffect(() => {
    if (!canManageAppwriteSchema()) return undefined

    let cancelled = false
    const run = async () => {
      setSchemaBusy(true)
      setSchemaError('')
      try {
        const applied = await syncAppwriteSchema(config, { apply: true, provisionAdmin: true })
        if (cancelled) return
        setSchemaResult(applied)
        const verified = await verifyAppwriteSetup(config)
        if (!cancelled) setVerifyResult(verified)
      } catch (err) {
        if (!cancelled) setSchemaError(err?.message || 'Schema sync failed.')
      } finally {
        if (!cancelled) setSchemaBusy(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [config])

  const handleInspect = async () => {
    setSchemaBusy(true)
    setSchemaError('')
    try {
      const inspected = await inspectAppwriteSchema(config)
      setSchemaResult(inspected)
    } catch (err) {
      setSchemaError(err?.message || 'Schema inspect failed.')
    } finally {
      setSchemaBusy(false)
    }
  }

  const handleApply = async () => {
    setSchemaBusy(true)
    setSchemaError('')
    try {
      const applied = await syncAppwriteSchema(config, { apply: true, provisionAdmin: true })
      setSchemaResult(applied)
      setVerifyResult(await verifyAppwriteSetup(config))
    } catch (err) {
      setSchemaError(err?.message || 'Schema apply failed.')
    } finally {
      setSchemaBusy(false)
    }
  }

  const collections = schemaResult?.summary?.collections || NEXUS_COLLECTIONS.map((collection) => ({
    id: collection.id,
    name: collection.name,
    missing: !schemaResult,
    attributes: collection.attributes.map((attribute) => ({ key: attribute.key, missing: !schemaResult })),
    indexes: collection.indexes.map((index) => ({ key: index.key, missing: !schemaResult })),
  }))

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header showSignIn={false}>
        <AppTopNav variant="admin" />
      </Header>

      <main className="flex-1 overflow-y-auto mx-auto w-full max-w-7xl px-4 py-8 pb-[120px] sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/30 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/30">
          <p className="text-sm uppercase tracking-[0.27em] text-blue-600">Admin dashboard</p>
          <h1 className="mt-4 text-3xl font-semibold">Workspace administration</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Monitor active members, review recent messages, and keep the Appwrite database schema in sync.
          </p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Signed in as {user?.fullName || user?.nexusId}</p>
        </div>

        <section className="mb-8 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Database schemas</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Uses the Appwrite endpoint, project, database ID, and API key to create any missing database, table, column, or index.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <p>Endpoint: <span className="font-medium">{config.endpoint || 'not set'}</span></p>
                <p>Project: <span className="font-medium">{config.projectId || 'not set'}</span></p>
                <p>Database: <span className="font-medium">{config.databaseId || 'not set'}</span></p>
                <p>API key: <span className="font-medium">{config.apiKey ? 'configured' : 'missing'}</span></p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleInspect}
                disabled={schemaBusy || !canManageAppwriteSchema()}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-slate-700"
              >
                Inspect schema
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={schemaBusy || !canManageAppwriteSchema()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {schemaBusy ? 'Syncing…' : 'Apply missing schema'}
              </button>
            </div>
          </div>

          {!canManageAppwriteSchema() && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
    Add VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, VITE_APPWRITE_DATABASE_ID, and VITE_APPWRITE_API_KEY to apply schema changes from this panel.
            </p>
          )}

          {schemaError && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
              {schemaError}
            </p>
          )}

          {schemaResult?.summary && (
            <p className={`mt-4 rounded-2xl border p-4 text-sm ${statusTone(schemaResult.summary.missingCount === 0)}`}>
              Missing objects: {schemaResult.summary.missingCount}. Created this run: {schemaResult.summary.createdCount}.
            </p>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {collections.map((collection) => (
              <div key={collection.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{collection.name || collection.id}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${collection.missing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {collection.missing ? 'missing table' : 'table ready'}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Columns</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {(collection.attributes || []).map((attribute) => (
                    <li key={attribute.key} className="flex justify-between gap-3">
                      <span>{attribute.key}</span>
                      <span>{attribute.missing ? 'missing' : 'ok'}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Indexes</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {(collection.indexes || []).map((index) => (
                    <li key={index.key} className="flex justify-between gap-3">
                      <span>{index.key}</span>
                      <span>{index.missing ? 'missing' : 'ok'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {verifyResult && (
            <div className="mt-6">
              <h3 className="font-semibold">Verification</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {verifyResult.checks.map((check) => (
                  <li key={check.name} className={`rounded-xl border px-3 py-2 ${statusTone(check.pass)}`}>
                    {check.pass ? 'Pass' : 'Fail'} — {check.name}{check.detail ? `: ${check.detail}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {schemaResult?.logs?.length > 0 && (
            <div className="mt-6 max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-800">
              {schemaResult.logs.map((log, index) => (
                <p key={`${log.at}-${index}`}>[{log.level}] {log.message}</p>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            Loading admin data...
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-semibold">Active members</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Latest registered members and account details.</p>
              <div className="mt-6 space-y-4">
                {activeUsers.map((member) => (
                  <div key={member.$id || member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{member.full_name || member.member_id}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Member #{member.member_id}</p>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(member.created_at || member.$createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-semibold">Recent messages</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Most recent chat activity across the workspace.</p>
              <div className="mt-6 space-y-4">
                {recentMessages.map((msg) => (
                  <div key={msg.$id || msg.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(msg.created_at || msg.$createdAt).toLocaleString()}</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{msg.type === 'text' ? msg.content : `(${msg.type}) ${msg.content}`}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chat ID: {msg.chat_id}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
      <NotificationStack />
    </div>
  )
}
