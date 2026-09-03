import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import { normalizeNexusId } from '../utils/nexusId'

const AuthContext = createContext()
const SESSION_STORAGE_KEY = 'nexus-chat-session'
const USER_STORAGE_KEY = 'nexus-chat-users'
const VOLATILE_SESSION_KEYS = [
  SESSION_STORAGE_KEY,
  'nexus-chat-state-v1',
  'nexus_e2ee_keys',
  'nexus_e2ee_enabled',
]

function normalizeUser(user) {
  return {
    id: user.id,
    nexusId: user.nexus_id || user.nexusId || user.member_id || user.memberId,
    nexusIdDisplay: user.nexusIdDisplay || user.memberIdDisplay || formatNexusIdForDisplay(user.nexus_id || user.nexusId || user.member_id || user.memberId),
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    fullName: user.full_name || user.fullName || `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim(),
    email: user.email,
    emailVerified: user.email_verified || user.emailVerified || false,
    role: user.role || user.user_role || user.profile_role || 'user',
    adminAuthenticated: Boolean(user.adminAuthenticated),
    avatarUrl: user.avatar_url || user.avatarUrl || null,
    createdAt: user.created_at || user.createdAt
  }
}

function getUserNexusId(user) {
  return String(user?.nexus_id || user?.nexusId || user?.member_id || user?.memberId || '').replace(/\D/g, '')
}

function generateNexusId(existingUsers) {
  const usedIds = new Set(existingUsers.map(getUserNexusId))
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
          if (parsed.adminAuthenticated) localStorage.removeItem(SESSION_STORAGE_KEY)
        }

        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const { data, error } = await supabase.from('members').select('id, member_id, nexus_id, first_name, last_name, full_name, email, role, avatar_url, is_active, created_at').eq('auth_user_id', session.user.id).maybeSingle()
            if (error) throw error
            if (data) setUser(normalizeUser({ ...data, email_verified: Boolean(session.user.email_confirmed_at) }))
          }
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
    const normalizedId = normalizeNexusId(nexusId)
    if (!normalizedId) throw new Error('Enter a valid 10-digit Nexus number.')
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: memberEmail, error } = await supabase.rpc('find_member_email_by_nexus_id', { search_nexus_id: normalizedId })
        if (error) throw error
        const email = memberEmail?.[0]?.email
        if (!email) {
          throw new Error('Nexus number not found. Please create an account first.')
        }
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        const { data, error: memberError } = await supabase.from('members').select('id, member_id, nexus_id, first_name, last_name, full_name, email, role, avatar_url, is_active, created_at').eq('auth_user_id', authData.user.id).single()
        if (memberError) throw memberError
        if (data.is_active === false) throw new Error('This Nexus account is inactive.')
        const sessionUser = normalizeUser({ ...data, email_verified: Boolean(authData.user.email_confirmed_at) })
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        setUser(sessionUser)
        return { user: sessionUser, nexusId: sessionUser.nexusId }
      } catch (err) {
        throw new Error(err?.message || 'Unable to sign in. Existing accounts must be migrated to Supabase Auth.')
      }
    }

    const storedUsers = readStoredUsers()
    const fallbackUser = storedUsers.find((candidate) => getUserNexusId(candidate) === normalizedId)
    if (!fallbackUser) throw new Error('Nexus number not found. Please create an account first.')
    if (fallbackUser.is_active === false || fallbackUser.isActive === false) throw new Error('This Nexus account is inactive.')
    if (String(password || '').trim() !== String(fallbackUser.password || '').trim()) {
      throw new Error('Incorrect password for this Nexus number.')
    }
    const sessionUser = normalizeUser(fallbackUser)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return { user: sessionUser, nexusId: sessionUser.nexusId }
  }

  const adminLogin = async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase Auth is not configured.')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    if (authError) throw new Error('Invalid administrator email or password.')
    const { data: member, error: memberError } = await supabase.from('members').select('id, member_id, nexus_id, first_name, last_name, full_name, email, role, avatar_url, is_active, created_at').eq('auth_user_id', authData.user.id).single()
    if (memberError || member?.role !== 'admin') throw new Error('This account is not authorized for administration.')
    if (member.is_active === false) throw new Error('This administrator account is inactive.')
    const adminUser = normalizeUser({ ...member, email_verified: Boolean(authData.user.email_confirmed_at), adminAuthenticated: true })
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminUser))
    setUser(adminUser)
    return { user: adminUser }
  }

  const switchAccount = async () => {
    if (supabase) await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      VOLATILE_SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
      window.dispatchEvent(new CustomEvent('nexus-auth:account-switched'))
    }
    setUser(null)
  }

  const register = async ({ firstName, lastName, email, password }) => {
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
      email: String(email || '').trim().toLowerCase(),
      email_verified: false,
      emailVerified: false,
      role: 'user',
      password: generatedPassword,
      avatar_url: null,
      avatarUrl: null,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
        })
        if (authError) throw authError
        const { error } = await supabase.from('members').insert({
          member_id: newUser.member_id,
          nexus_id: newUser.nexus_id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          full_name: newUser.full_name,
          email: newUser.email,
          password: null,
          auth_user_id: authData.user.id,
          role: newUser.role,
          avatar_url: newUser.avatar_url,
          created_at: newUser.created_at,
        })
        if (error) throw error
        if (!authData.session) {
          return { user: newUser, nexusId, password: generatedPassword, requiresEmailConfirmation: true }
        }
        const { data, error: memberError } = await supabase.from('members').select('id, member_id, nexus_id, first_name, last_name, full_name, email, role, avatar_url, is_active, created_at').eq('auth_user_id', authData.user.id).single()
        if (memberError) throw memberError
        const sessionUser = normalizeUser(data || newUser)
        sessionUser.nexusIdDisplay = formatNexusIdForDisplay(sessionUser.nexusId)
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
        }
        setUser(sessionUser)
        return { user: sessionUser, nexusId, password: generatedPassword }
      } catch {
        if (isSupabaseConfigured() && supabase) throw new Error('Unable to create your Supabase Auth account. Please try again.')
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

  const updateProfile = async (updates) => {
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
      if (getUserNexusId(candidate) === getUserNexusId(user)) {
        return {
          ...candidate,
          ...updates
        }
      }
      return candidate
    })
    writeStoredUsers(updatedUsers)
    
    if (isSupabaseConfigured() && supabase) {
      try {
        const supabaseUpdates = {}
        if (updates.firstName !== undefined) {
          supabaseUpdates.first_name = updates.firstName
        }
        if (updates.lastName !== undefined) {
          supabaseUpdates.last_name = updates.lastName
        }
        if (updates.fullName !== undefined) {
          supabaseUpdates.full_name = updates.fullName
        }
        if (updates.avatarUrl !== undefined) {
          supabaseUpdates.avatar_url = updates.avatarUrl
        }
        
        const { error } = await supabase.from('members').update(supabaseUpdates).eq('member_id', user.nexusId)
        if (error) throw error
      } catch (err) {
        console.error('Supabase profile update failed', err)
      }
    }
  }

  const value = {
    user,
    loading,
    login,
    adminLogin,
    switchAccount,
    logout: switchAccount,
    register,
    updateProfile
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
