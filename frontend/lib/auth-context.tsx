'use client'

/**
 * Auth Context
 * ------------
 * Provides authentication state and actions to all components.
 * JWT tokens are persisted in localStorage. On page load, the user
 * is restored from the stored token (no manual login required).
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { authApi, tokenStore, type UserProfile, type AuthTokens } from '@/lib/api'

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  // ── Restore session on mount ──────────────────────────────────────────────
  React.useEffect(() => {
    const token = tokenStore.getAccess()
    if (!token) {
      setIsLoading(false)
      return
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => {
        // Token expired — clear and redirect
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = React.useCallback(async (email: string, password: string) => {
    setError(null)
    const data: AuthTokens = await authApi.login(email, password)
    tokenStore.set(data.access_token, data.refresh_token)
    const userProfile = await authApi.me()
    setUser(userProfile)
    router.push('/dashboard')
  }, [router])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = React.useCallback(
    async (payload: { email: string; password: string; full_name: string }) => {
      setError(null)
      const data: AuthTokens = await authApi.register(payload)
      tokenStore.set(data.access_token, data.refresh_token)
      const userProfile = await authApi.me()
      setUser(userProfile)
      router.push('/dashboard')
    },
    [router]
  )

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = React.useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore errors — always clear local state
    } finally {
      tokenStore.clear()
      setUser(null)
      router.push('/login')
    }
  }, [router])

  // ── Refresh user data ─────────────────────────────────────────────────────
  const refreshUser = React.useCallback(async () => {
    const fresh = await authApi.me()
    setUser(fresh)
  }, [])

  const clearError = React.useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/**
 * Hook that redirects to /login if not authenticated.
 * Use in dashboard pages.
 */
export function useRequireAuth(): AuthContextType {
  const auth = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/login')
    }
  }, [auth.isLoading, auth.isAuthenticated, router])

  return auth
}
