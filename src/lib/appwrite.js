import { Client, Databases, ID, Query, Realtime } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || ''
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || ''
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'nexus-chat'
const apiKey = import.meta.env.VITE_APPWRITE_API_KEY || ''

export const APPWRITE_DATABASE_ID = databaseId

export function isAppwriteConfigured() {
  return Boolean(endpoint && projectId)
}

export function canManageAppwriteSchema() {
  return isAppwriteConfigured() && Boolean(apiKey)
}

export function getAppwriteConfig() {
  return {
    endpoint: endpoint.replace(/\/$/, ''),
    projectId,
    databaseId,
    apiKey,
  }
}

let client = null
let databases = null

if (isAppwriteConfigured()) {
  client = new Client().setEndpoint(endpoint).setProject(projectId)
  databases = new Databases(client)
}

export { client, databases, ID, Query, Realtime }

export function isAdminRole(role) {
  return role === 'admin' || role === 'supabase_admin' || role === 'appwrite_admin'
}
