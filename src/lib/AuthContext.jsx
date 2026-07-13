import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const AuthContext = createContext()
const SESSION_STORAGE_KEY = 'nexus-chat-session'
const USER_STORAGE_KEY = 'nexus-chat-users'

function normalizeUser(user) {
  return {
    id: user.id,
    nexusId: user.nexus_id || user.nexusId || user.member_id || user.memberId,
    nexusIdDisplay: user.nexusIdDisplay || user.memberIdDisplay || formatNexusIdForDisplay(user.nexus_id || user.nexusId || user.member_id || user.memberId),
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    fullName: user.full_name || user.fullName || `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim(),
    role: user.role || user.user_role || user.profile_role || 'user',
    password: user.password,
    createdAt: user.created_at || user.createdAt
  }
}

function generateNexusId(existingUsers) {
  const usedIds = new Set(existingUsers.map((user) => user.nexus_id || user.nexusId || user.member_id || user.memberId))
  let candidate = ''
  do {
    // Generate 10-digit ID starting with 10 (10-xxxx-xxxx format)
    const randomSuffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    candidate = `10${randomSuffix}`
  } while (usedIds.has(candidate))
  return candidate
}

function formatNexusIdForDisplay(raw) {
  const s = String(raw || '').replace(/\D/g, '') // Remove non-digit characters
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cachedSession = typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession)
          setUser(normalizeUser(parsed))
          setLoading(false)
          return
        }

        if (!isSupabaseConfigured() || !supabase) {
          throw new Error('Supabase not configured')
        }

        const { data, error } = await supabase.from('members').select('*').limit(1)
        if (error) throw error
        if (data && data.length > 0) {
          setUser(normalizeUser(data[0]))
        } else {
          setUser(null)
        }
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

  const login = async (nexusId, password) => {
    const normalizedId = String(nexusId || '').replace(/\D/g, '') // Remove non-digit characters
    const storedUsers = readStoredUsers()

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('members').select('*').eq('member_id', normalizedId).maybeSingle()
        if (error) throw error
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
  }

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
    setUser(null)
  }

  const register = async ({ firstName, lastName, password }) => {
    const normalizedFirstName = String(firstName || '').trim()
    const normalizedLastName = String(lastName || '').trim()
    const storedUsers = readStoredUsers()
    const nexusId = generateNexusId(storedUsers)
    const generatedPassword = String(password || '').trim() || `${nexusId.slice(-4)}${Math.random().toString(36).slice(-4)}`
    const fullName = [normalizedFirstName, normalizedLastName].filter(Boolean).join(' ').trim()

    const newUser = {
      id: `${Date.now()}`,
      member_id: nexusId, // Keep for backwards compatibility
      nexus_id: nexusId,
      nexusId,
      nexusIdDisplay: formatNexusIdForDisplay(nexusId),
      first_name: normalizedFirstName,
      firstName: normalizedFirstName,
      last_name: normalizedLastName,
      lastName: normalizedLastName,
      full_name: fullName,
      fullName,
      role: 'user',
      password: generatedPassword,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('members').insert(newUser).select().single()
        if (error) throw error
        const sessionUser = normalizeUser(data || newUser)
        sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        }
        setUser(sessionUser)
        return { user: sessionUser, nexusId, password: generatedPassword }
      } catch {
        const nextUsers = [newUser, ...storedUsers]
        writeStoredUsers(nextUsers)
        const sessionUser = normalizeUser(newUser)
        sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        setUser(sessionUser)
        return { user: sessionUser, nexusId, password: generatedPassword }
      }
    }

    const nextUsers = [newUser, ...storedUsers]
    writeStoredUsers(nextUsers)
    const sessionUser = normalizeUser(newUser)
    sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return { user: sessionUser, nexusId, password: generatedPassword }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register
  }

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
