import 'server-only'

import { cookies } from 'next/headers'
import { wpFetch } from '@/lib/wp/client'
import { REFRESH_TOKEN } from '@/lib/wp/operations'
import { AUTH_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from '@/lib/wp/config'

/**
 * Token storage.
 *
 * Both JWTs live in httpOnly cookies so no script running on the page can read
 * them — this is the XSS mitigation the brief asks for. `localStorage` is never
 * used for credentials anywhere in this system.
 *
 * The access token is short-lived (WPGraphQL JWT Authentication issues it with
 * a 5-minute expiry by default); the refresh token is what actually keeps the
 * visitor signed in, and is the only long-lived secret.
 */

const AUTH_COOKIE = 'alifleet_auth'
const REFRESH_COOKIE = 'alifleet_refresh'

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function setSessionCookies(tokens: {
  authToken: string
  refreshToken: string
}) {
  const jar = await cookies()
  jar.set(AUTH_COOKIE, tokens.authToken, {
    ...baseCookie,
    maxAge: AUTH_TOKEN_MAX_AGE,
  })
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookie,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}

export async function clearSessionCookies() {
  const jar = await cookies()
  jar.set(AUTH_COOKIE, '', { ...baseCookie, maxAge: 0 })
  jar.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 })
}

/** Cheap check used by route protection — does NOT validate the token. */
export async function hasSession(): Promise<boolean> {
  const jar = await cookies()
  return Boolean(jar.get(REFRESH_COOKIE)?.value || jar.get(AUTH_COOKIE)?.value)
}

/**
 * Returns a usable access token, silently exchanging the refresh token when the
 * access cookie has expired.
 *
 * Note on persistence: Server Components are not allowed to write cookies. When
 * a refresh happens during a page render we therefore use the new token for
 * that render only and let the write fail quietly — the next Server Action or
 * Route Handler will persist a fresh one. The refresh token itself is unchanged
 * by this flow, so nothing is lost.
 */
export async function getAuthToken(): Promise<string | null> {
  const jar = await cookies()
  const existing = jar.get(AUTH_COOKIE)?.value
  if (existing) return existing

  const refreshToken = jar.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return null

  const data = await wpFetch<{
    refreshJwtAuthToken: { authToken: string | null } | null
  }>(REFRESH_TOKEN, { refreshToken })

  const authToken = data.refreshJwtAuthToken?.authToken ?? null
  if (!authToken) return null

  try {
    jar.set(AUTH_COOKIE, authToken, {
      ...baseCookie,
      maxAge: AUTH_TOKEN_MAX_AGE,
    })
  } catch {
    // Read-only cookie jar (Server Component render) — expected, see above.
  }

  return authToken
}
