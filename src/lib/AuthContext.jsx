import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { databases, isAppwriteConfigured, isAdminRole, APPWRITE_DATABASE_ID, ID, Query } from './appwrite'

const AuthContext = createContext()
const SESSION_STORAGE_KEY = 'nexus-chat-session'
const USER_STORAGE_KEY = 'nexus-chat-users'

function normalizeUser(user) {
  const rawRole = user.role || user.user_role || user.profile_role || 'user'
  return {
    id: user.id || user.$id,
    nexusId: user.nexus_id || user.nexusId || user.member_id || user.memberId,
    nexusIdDisplay: user.nexusIdDisplay || user.memberIdDisplay || formatNexusIdForDisplay(user.nexus_id || user.nexusId || user.member_id || user.memberId),
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    fullName: user.full_name || user.fullName || `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim(),
    email: user.email,
    emailVerified: user.email_verified || user.emailVerified || false,
    role: isAdminRole(rawRole) ? 'admin' : rawRole,
    avatarUrl: user.avatar_url || user.avatarUrl || null,
    createdAt: user.created_at || user.createdAt || user.$createdAt
  }
}

function generateNexusId(existingUsers) {
  const usedIds = new Set(existingUsers.map((user) => user.nexus_id || user.nexusId || user.member_id || user.memberId))
  let candidate = ''
  do {
    const randomSuffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    candidate = `10${randomSuffix}`
  } while (usedIds.has(candidate))
  return candidate
}

function formatNexusIdForDisplay(raw) {
  const s = String(raw || '').replace(/\D/g, '')
  if (s.length >= 2) {
    let formatted = s.slice(0, 2)
    if (s.length >= 6) {
      formatted += '-' + s.slice(2, 6)
      if (s.length >= 10) {
        formatted += '-' + s.slice(6, 10)
      }
    }
    return formatted
  }
  return s
}

function readStoredUsers() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStoredUsers(users) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users))
}

async function findMemberByNexusId(normalizedId) {
  const { documents } = await databases.listDocuments(APPWRITE_DATABASE_ID, 'members', [
    Query.equal('member_id', normalizedId),
    Query.limit(1),
  ])
  return documents?.[0] || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cachedSession = typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession)
          const storedNexusId = parsed.nexusId || parsed.member_id || parsed.memberId

          if (isAppwriteConfigured() && databases && storedNexusId) {
            try {
              const data = await findMemberByNexusId(String(storedNexusId))
              if (data) {
                setUser(normalizeUser(data))
                setLoading(false)
                return
              }
            } catch {
            }
          }

          setUser(normalizeUser(parsed))
          setLoading(false)
          return
        }

        setUser(null)
      } catch {
        const cachedSession = typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null
        if (cachedSession) {
          setUser(normalizeUser(JSON.parse(cachedSession)))
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (nexusId, password) => {
    const normalizedId = String(nexusId || '').replace(/\D/g, '')
    const storedUsers = readStoredUsers()

    if (isAppwriteConfigured() && databases) {
      try {
        const data = await findMemberByNexusId(normalizedId)
        if (!data) {
          throw new Error('Nexus number not found. Please create an account first.')
        }
        if (String(password || '').trim() !== String(data.password || '').trim()) {
          throw new Error('Incorrect password for this Nexus number.')
        }

        const sessionUser = normalizeUser(data)
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        }
        setUser(sessionUser)
        return { user: sessionUser, nexusId: sessionUser.nexusId }
      } catch (err) {
        if (storedUsers.length) {
          const fallbackUser = storedUsers.find((candidate) => (candidate.nexus_id || candidate.nexusId || candidate.member_id || candidate.memberId) === normalizedId)
          if (fallbackUser) {
            if (String(password || '').trim() !== String(fallbackUser.password || '').trim()) {
              throw new Error('Incorrect password for this Nexus number.')
            }
            const sessionUser = normalizeUser(fallbackUser)
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
            setUser(sessionUser)
            return { user: sessionUser, nexusId: sessionUser.nexusId }
          }
        }
        throw err
      }
    }

    const fallbackUser = storedUsers.find((candidate) => (candidate.nexus_id || candidate.nexusId || candidate.member_id || candidate.memberId) === normalizedId)
    if (!fallbackUser) throw new Error('Nexus number not found. Please create an account first.')
    if (String(password || '').trim() !== String(fallbackUser.password || '').trim()) {
      throw new Error('Incorrect password for this Nexus number.')
    }
    const sessionUser = normalizeUser(fallbackUser)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return { user: sessionUser, nexusId: sessionUser.nexusId }
  }, [])

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
    setUser(null)
  }, [])

  const register = useCallback(async ({ firstName, lastName, password }) => {
    const normalizedFirstName = String(firstName || '').trim()
    const normalizedLastName = String(lastName || '').trim()
    const storedUsers = readStoredUsers()
    const nexusId = generateNexusId(storedUsers)
    const generatedPassword = String(password || '').trim() || `${nexusId.slice(-4)}${Math.random().toString(36).slice(-4)}`
    const fullName = [normalizedFirstName, normalizedLastName].filter(Boolean).join(' ').trim()
    const createdAt = new Date().toISOString()

    const localUser = {
      id: `${Date.now()}`,
      member_id: nexusId,
      nexus_id: nexusId,
      nexusId,
      nexusIdDisplay: formatNexusIdForDisplay(nexusId),
      first_name: normalizedFirstName,
      firstName: normalizedFirstName,
      last_name: normalizedLastName,
      lastName: normalizedLastName,
      full_name: fullName,
      fullName,
      email: null,
      email_verified: false,
      emailVerified: false,
      role: 'user',
      password: generatedPassword,
      created_at: createdAt,
      createdAt,
    }

    if (isAppwriteConfigured() && databases) {
      try {
        const data = await databases.createDocument(APPWRITE_DATABASE_ID, 'members', ID.unique(), {
          member_id: nexusId,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          full_name: fullName,
          password: generatedPassword,
          email: null,
          email_verified: false,
          role: 'user',
          avatar_url: null,
          created_at: createdAt,
        })
        const sessionUser = normalizeUser(data)
        sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        }
        setUser(sessionUser)
        return { user: sessionUser, nexusId, password: generatedPassword }
      } catch {
        const nextUsers = [localUser, ...storedUsers]
        writeStoredUsers(nextUsers)
        const sessionUser = normalizeUser(localUser)
        sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        setUser(sessionUser)
        return { user: sessionUser, nexusId, password: generatedPassword }
      }
    }

    const nextUsers = [localUser, ...storedUsers]
    writeStoredUsers(nextUsers)
    const sessionUser = normalizeUser(localUser)
    sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return { user: sessionUser, nexusId, password: generatedPassword }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    if (!user) return
    const updatedUser = {
      ...user,
      ...updates
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser))
    }
    setUser(updatedUser)

    const storedUsers = readStoredUsers()
    const updatedUsers = storedUsers.map(candidate => {
      const candidateId = candidate.nexus_id || candidate.nexusId || candidate.member_id || candidate.memberId
      if (candidateId === user.nexusId) {
        return {
          ...candidate,
          ...updates
        }
      }
      return candidate
    })
    writeStoredUsers(updatedUsers)

    if (isAppwriteConfigured() && databases) {
      try {
        const member = await findMemberByNexusId(user.nexusId)
        if (!member) return

        const appwriteUpdates = {}
        if (updates.firstName !== undefined) appwriteUpdates.first_name = updates.firstName
        if (updates.lastName !== undefined) appwriteUpdates.last_name = updates.lastName
        if (updates.fullName !== undefined) appwriteUpdates.full_name = updates.fullName
        if (updates.avatarUrl !== undefined) appwriteUpdates.avatar_url = updates.avatarUrl

        await databases.updateDocument(APPWRITE_DATABASE_ID, 'members', member.$id, appwriteUpdates)
      } catch (err) {
        console.error('Appwrite profile update failed', err)
      }
    }
  }, [user])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    register,
    updateProfile
  }), [user, loading, login, logout, register, updateProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export { formatNexusIdForDisplay }
