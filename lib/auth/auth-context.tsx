'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Viewer } from '@/lib/wp/types'

/**
 * Read-only view of the session for client components (the header, mainly).
 *
 * The value is resolved on the server in the root layout and handed down as a
 * prop — deliberately never fetched in the browser, since the JWT lives in an
 * httpOnly cookie the client cannot read.
 */
type AuthContextValue = {
  viewer: Viewer | null
  signedIn: boolean
  /** Whether a WordPress backend is configured at all. */
  backendReady: boolean
  /** Best available label for the signed-in user. */
  displayName: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  viewer,
  backendReady,
  children,
}: {
  viewer: Viewer | null
  backendReady: boolean
  children: React.ReactNode
}) {
  const value = useMemo<AuthContextValue>(() => {
    const displayName =
      [viewer?.firstName, viewer?.lastName].filter(Boolean).join(' ').trim() ||
      viewer?.name ||
      viewer?.username ||
      ''
    return {
      viewer,
      signedIn: Boolean(viewer),
      backendReady,
      displayName,
    }
  }, [viewer, backendReady])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}
