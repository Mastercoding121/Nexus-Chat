import { Query } from 'appwrite'
import { ADMIN_DEFAULTS, APPWRITE_DATABASE_NAME, COLLECTION_PERMISSIONS, NEXUS_COLLECTIONS } from './appwriteSchema.js'

const EXISTING_STATUSES = new Set([409, 400])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isAlreadyExists(status, payload) {
  const type = String(payload?.type || '')
  const message = String(payload?.message || '').toLowerCase()
  return status === 409
    || (EXISTING_STATUSES.has(status) && /already exists|duplicate|conflict/.test(message))
    || type.includes('already_exists')
}

async function appwriteRequest(config, method, path, body) {
  const endpoint = String(config.endpoint || '').replace(/\/$/, '')
  const url = `${endpoint}${path.startsWith('/') ? path : `/${path}`}`
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': config.projectId,
    'X-Appwrite-Key': config.apiKey,
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { message: text }
  }

  return { ok: response.ok, status: response.status, payload }
}

function pushLog(logs, level, message, extra) {
  logs.push({ level, message, extra, at: new Date().toISOString() })
}

async function ensureDatabase(config, logs, { apply }) {
  const { payload, status, ok } = await appwriteRequest(config, 'GET', `/databases/${config.databaseId}`)
  if (ok) {
    pushLog(logs, 'ok', `Database "${config.databaseId}" exists`)
    return { id: payload.$id, created: false, missing: false }
  }

  if (status !== 404) {
    throw new Error(payload?.message || `Failed to read database (${status})`)
  }

  pushLog(logs, 'missing', `Database "${config.databaseId}" is missing`)
  if (!apply) return { id: config.databaseId, created: false, missing: true }

  const created = await appwriteRequest(config, 'POST', '/databases', {
    databaseId: config.databaseId,
    name: APPWRITE_DATABASE_NAME,
    enabled: true,
  })
  if (!created.ok && !isAlreadyExists(created.status, created.payload)) {
    throw new Error(created.payload?.message || `Failed to create database (${created.status})`)
  }
  pushLog(logs, 'created', `Created database "${config.databaseId}"`)
  return { id: config.databaseId, created: true, missing: false }
}

async function ensureCollection(config, collection, logs, { apply }) {
  const path = `/databases/${config.databaseId}/collections/${collection.id}`
  const existing = await appwriteRequest(config, 'GET', path)
  if (existing.ok) {
    pushLog(logs, 'ok', `Collection "${collection.id}" exists`)
    return { missing: false, created: false, document: existing.payload }
  }

  if (existing.status !== 404) {
    throw new Error(existing.payload?.message || `Failed to read collection ${collection.id}`)
  }

  pushLog(logs, 'missing', `Collection "${collection.id}" is missing`)
  if (!apply) return { missing: true, created: false, document: null }

  const created = await appwriteRequest(config, 'POST', `/databases/${config.databaseId}/collections`, {
    collectionId: collection.id,
    name: collection.name,
    permissions: COLLECTION_PERMISSIONS,
    documentSecurity: false,
    enabled: true,
  })
  if (!created.ok && !isAlreadyExists(created.status, created.payload)) {
    throw new Error(created.payload?.message || `Failed to create collection ${collection.id}`)
  }
  pushLog(logs, 'created', `Created collection "${collection.id}"`)
  return { missing: false, created: true, document: created.payload }
}

function attributePath(type) {
  if (type === 'boolean') return 'boolean'
  if (type === 'datetime') return 'datetime'
  if (type === 'integer') return 'integer'
  if (type === 'float') return 'float'
  if (type === 'email') return 'email'
  return 'string'
}

async function waitForAttribute(config, collectionId, key, logs) {
  const path = `/databases/${config.databaseId}/collections/${collectionId}/attributes/${key}`
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await appwriteRequest(config, 'GET', path)
    const status = result.payload?.status
    if (result.ok && status === 'available') return
    if (result.ok && status === 'failed') {
      throw new Error(`Attribute ${collectionId}.${key} failed to build`)
    }
    await sleep(400)
  }
  pushLog(logs, 'warn', `Timed out waiting for ${collectionId}.${key} to become available`)
}

async function ensureAttribute(config, collection, attribute, logs, { apply }) {
  const listPath = `/databases/${config.databaseId}/collections/${collection.id}/attributes`
  const existing = await appwriteRequest(config, 'GET', `${listPath}/${attribute.key}`)
  if (existing.ok) {
    pushLog(logs, 'ok', `Column ${collection.id}.${attribute.key} exists`)
    return { missing: false, created: false }
  }

  if (existing.status !== 404) {
    throw new Error(existing.payload?.message || `Failed to read ${collection.id}.${attribute.key}`)
  }

  pushLog(logs, 'missing', `Column ${collection.id}.${attribute.key} is missing`)
  if (!apply) return { missing: true, created: false }

  const body = {
    key: attribute.key,
    required: Boolean(attribute.required),
    array: false,
  }
  if (attribute.type === 'string' || attribute.type === 'email') {
    body.size = attribute.size || 255
  }
  if (attribute.default !== undefined && !attribute.required) {
    body.default = attribute.default
  }

  const created = await appwriteRequest(
    config,
    'POST',
    `${listPath}/${attributePath(attribute.type)}`,
    body
  )
  if (!created.ok && !isAlreadyExists(created.status, created.payload)) {
    throw new Error(created.payload?.message || `Failed to create ${collection.id}.${attribute.key}`)
  }
  pushLog(logs, 'created', `Created column ${collection.id}.${attribute.key}`)
  await waitForAttribute(config, collection.id, attribute.key, logs)
  return { missing: false, created: true }
}

async function ensureIndex(config, collection, index, logs, { apply }) {
  const path = `/databases/${config.databaseId}/collections/${collection.id}/indexes/${index.key}`
  const existing = await appwriteRequest(config, 'GET', path)
  if (existing.ok) {
    pushLog(logs, 'ok', `Index ${collection.id}.${index.key} exists`)
    return { missing: false, created: false }
  }

  if (existing.status !== 404) {
    throw new Error(existing.payload?.message || `Failed to read index ${index.key}`)
  }

  pushLog(logs, 'missing', `Index ${collection.id}.${index.key} is missing`)
  if (!apply) return { missing: true, created: false }

  const created = await appwriteRequest(
    config,
    'POST',
    `/databases/${config.databaseId}/collections/${collection.id}/indexes`,
    {
      key: index.key,
      type: index.type,
      attributes: index.attributes,
      orders: index.attributes.map(() => 'ASC'),
    }
  )
  if (!created.ok && !isAlreadyExists(created.status, created.payload)) {
    throw new Error(created.payload?.message || `Failed to create index ${index.key}`)
  }
  pushLog(logs, 'created', `Created index ${collection.id}.${index.key}`)
  return { missing: false, created: true }
}

export async function inspectAppwriteSchema(config) {
  return syncAppwriteSchema(config, { apply: false, provisionAdmin: false })
}

export async function syncAppwriteSchema(config, options = {}) {
  const apply = Boolean(options.apply)
  const shouldProvisionAdmin = options.provisionAdmin !== false && apply
  const logs = []
  const summary = {
    database: null,
    collections: [],
    missingCount: 0,
    createdCount: 0,
    admin: null,
  }

  if (!config?.endpoint || !config?.projectId) {
    throw new Error('Appwrite endpoint and project ID are required.')
  }
  if (!config?.apiKey) {
    throw new Error('Appwrite API key is required to inspect or apply schema.')
  }
  if (!config?.databaseId) {
    throw new Error('Appwrite database ID is required.')
  }

  const database = await ensureDatabase(config, logs, { apply })
  summary.database = database
  if (database.missing) summary.missingCount += 1
  if (database.created) summary.createdCount += 1

  if (database.missing && !apply) {
    for (const collection of NEXUS_COLLECTIONS) {
      summary.collections.push({
        id: collection.id,
        name: collection.name,
        missing: true,
        attributes: collection.attributes.map((attribute) => ({ key: attribute.key, missing: true })),
        indexes: collection.indexes.map((index) => ({ key: index.key, missing: true })),
      })
      summary.missingCount += 1 + collection.attributes.length + collection.indexes.length
    }
    return { logs, summary, schema: NEXUS_COLLECTIONS }
  }

  for (const collection of NEXUS_COLLECTIONS) {
    const collectionState = {
      id: collection.id,
      name: collection.name,
      missing: false,
      attributes: [],
      indexes: [],
    }
    const ensured = await ensureCollection(config, collection, logs, { apply })
    collectionState.missing = ensured.missing
    if (ensured.missing) summary.missingCount += 1
    if (ensured.created) summary.createdCount += 1

    if (ensured.missing && !apply) {
      collectionState.attributes = collection.attributes.map((attribute) => ({ key: attribute.key, missing: true }))
      collectionState.indexes = collection.indexes.map((index) => ({ key: index.key, missing: true }))
      summary.missingCount += collection.attributes.length + collection.indexes.length
      summary.collections.push(collectionState)
      continue
    }

    for (const attribute of collection.attributes) {
      const result = await ensureAttribute(config, collection, attribute, logs, { apply })
      collectionState.attributes.push({ key: attribute.key, type: attribute.type, missing: result.missing })
      if (result.missing) summary.missingCount += 1
      if (result.created) summary.createdCount += 1
    }

    for (const index of collection.indexes) {
      const result = await ensureIndex(config, collection, index, logs, { apply })
      collectionState.indexes.push({ key: index.key, type: index.type, missing: result.missing })
      if (result.missing) summary.missingCount += 1
      if (result.created) summary.createdCount += 1
    }

    summary.collections.push(collectionState)
  }

  if (shouldProvisionAdmin) {
    summary.admin = await provisionAdminUser(config, logs, { apply: true })
  }

  return { logs, summary, schema: NEXUS_COLLECTIONS }
}

export async function provisionAdminUser(config, logs = [], { apply } = { apply: true }) {
  const admin = {
    member_id: config.adminMemberId || ADMIN_DEFAULTS.memberId,
    email: config.adminEmail || ADMIN_DEFAULTS.email,
    first_name: ADMIN_DEFAULTS.firstName,
    last_name: ADMIN_DEFAULTS.lastName,
    full_name: ADMIN_DEFAULTS.fullName,
    password: config.adminPassword || ADMIN_DEFAULTS.password,
    role: ADMIN_DEFAULTS.role,
    email_verified: true,
    created_at: new Date().toISOString(),
  }

  const query = encodeURIComponent(Query.equal('member_id', admin.member_id))
  const listed = await appwriteRequest(
    config,
    'GET',
    `/databases/${config.databaseId}/collections/members/documents?queries[]=${query}`
  )
  if (!listed.ok) {
    throw new Error(listed.payload?.message || 'Could not query members for admin provisioning.')
  }

  const existing = listed.payload?.documents?.[0]
  if (existing) {
    pushLog(logs, 'ok', `Admin already exists (${existing.member_id})`)
    return { created: false, record: existing }
  }

  if (!apply) {
    pushLog(logs, 'missing', `Admin member ${admin.member_id} is missing`)
    return { created: false, record: null, missing: true }
  }

  const created = await appwriteRequest(
    config,
    'POST',
    `/databases/${config.databaseId}/collections/members/documents`,
    {
      documentId: 'unique()',
      data: admin,
      permissions: COLLECTION_PERMISSIONS,
    }
  )
  if (!created.ok && !isAlreadyExists(created.status, created.payload)) {
    throw new Error(created.payload?.message || 'Failed to provision admin member.')
  }
  pushLog(logs, 'created', `Provisioned admin member ${admin.member_id}`)
  return { created: true, record: created.payload }
}

export async function verifyAppwriteSetup(config) {
  const checks = []
  const add = (name, pass, detail) => checks.push({ name, pass, detail })

  const database = await appwriteRequest(config, 'GET', `/databases/${config.databaseId}`)
  add('database exists', database.ok, database.payload?.name || database.payload?.message)

  for (const collection of NEXUS_COLLECTIONS) {
    const result = await appwriteRequest(config, 'GET', `/databases/${config.databaseId}/collections/${collection.id}`)
    add(`collection ${collection.id}`, result.ok, result.payload?.name || result.payload?.message)
  }

  const query = encodeURIComponent(Query.equal('member_id', config.adminMemberId || ADMIN_DEFAULTS.memberId))
  const listed = await appwriteRequest(
    config,
    'GET',
    `/databases/${config.databaseId}/collections/members/documents?queries[]=${query}`
  )
  const admin = listed.payload?.documents?.[0]
  add('admin member exists', Boolean(admin), admin?.email || listed.payload?.message)
  add('admin role is admin', admin?.role === 'admin' || admin?.role === 'appwrite_admin', admin?.role)
  add('admin email verified', Boolean(admin?.email_verified), String(admin?.email_verified))

  return {
    ok: checks.every((check) => check.pass),
    checks,
  }
}

export { NEXUS_COLLECTIONS }
