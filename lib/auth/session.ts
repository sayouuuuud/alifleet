import 'server-only'

import { cookies, headers } from 'next/headers'
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

/**
 * Coolify currently exposes the storefront over HTTP, while production may
 * later sit behind an HTTPS proxy. A hard-coded `secure: true` makes browsers
 * silently discard the login cookies on the current HTTP origin. Prefer the
 * proxy's protocol signal and keep a safe HTTP fallback for this deployment.
 */
async function sessionCookieOptions() {
  const requestHeaders = await headers()
  const forwardedProto = requestHeaders
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase()

  let secure = forwardedProto === 'https'
  if (!forwardedProto) {
    const forwarded = requestHeaders.get('forwarded') ?? ''
    const protocol = forwarded.match(/(?:^|;)\s*proto=([^;]+)/i)?.[1]
    secure = protocol?.trim().toLowerCase() === 'https'
  }

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  }
}

export async function setSessionCookies(tokens: {
  authToken: string
  refreshToken: string
}) {
  const jar = await cookies()
  const cookieOptions = await sessionCookieOptions()
  jar.set(AUTH_COOKIE, tokens.authToken, {
    ...cookieOptions,
    maxAge: AUTH_TOKEN_MAX_AGE,
  })
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}

export async function clearSessionCookies() {
  const jar = await cookies()
  const cookieOptions = await sessionCookieOptions()
  jar.set(AUTH_COOKIE, '', { ...cookieOptions, maxAge: 0 })
  jar.set(REFRESH_COOKIE, '', { ...cookieOptions, maxAge: 0 })
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
    const cookieOptions = await sessionCookieOptions()
    jar.set(AUTH_COOKIE, authToken, {
      ...cookieOptions,
      maxAge: AUTH_TOKEN_MAX_AGE,
    })
  } catch {
    // Read-only cookie jar (Server Component render) — expected, see above.
  }

  return authToken
}
