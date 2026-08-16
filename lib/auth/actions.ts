'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { wpFetch } from '@/lib/wp/client'
import { WpError, type AuthErrorCode } from '@/lib/wp/errors'
import { isWpConfigured } from '@/lib/wp/config'
import {
  LOGIN,
  REGISTER_USER,
  SEND_PASSWORD_RESET,
  UPDATE_CUSTOMER_ADDRESSES,
  UPDATE_CUSTOMER_PROFILE,
} from '@/lib/wp/operations'
import type { AuthActionState } from '@/lib/wp/types'
import {
  clearSessionCookies,
  getAuthToken,
  setSessionCookies,
} from './session'

const fail = (
  code: AuthErrorCode,
  fieldErrors?: AuthActionState['fieldErrors']
): AuthActionState => ({ status: 'error', code, fieldErrors })

const codeOf = (error: unknown): AuthErrorCode => {
  if (error instanceof WpError) return error.code
  console.log('[v0] Unexpected auth error:', error)
  return 'unknown'
}

const text = (data: FormData, key: string) =>
  String(data.get(key) ?? '').trim()

/**
 * The sign-in and reset forms label this input `usernameOrEmail` (WordPress
 * accepts either), while the register form calls it `username`. Reading both
 * keys keeps the server action tolerant of whichever form posted to it.
 */
const identifier = (data: FormData) =>
  text(data, 'usernameOrEmail') || text(data, 'username')

/** Only used to catch obvious typos client-side validation may have missed. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)

/* -------------------------------------------------------------------------- */
/*  Sign in                                                                    */
/* -------------------------------------------------------------------------- */

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isWpConfigured()) return fail('not_configured')

  const username = identifier(formData)
  const password = String(formData.get('password') ?? '')
  const redirectTo = text(formData, 'redirectTo') || '/account'

  const fieldErrors: AuthActionState['fieldErrors'] = {}
  if (!username) fieldErrors.usernameOrEmail = 'missing_fields'
  if (!password) fieldErrors.password = 'missing_fields'
  if (Object.keys(fieldErrors).length) return fail('missing_fields', fieldErrors)

  try {
    const data = await wpFetch<{
      login: {
        authToken: string | null
        refreshToken: string | null
      } | null
    }>(LOGIN, { username, password })

    const authToken = data.login?.authToken
    const refreshToken = data.login?.refreshToken
    if (!authToken || !refreshToken) return fail('invalid_credentials')

    await setSessionCookies({ authToken, refreshToken })
  } catch (error) {
    return fail(codeOf(error))
  }

  // Outside the try block: redirect() signals by throwing, and must not be
  // swallowed by the error handler above.
  //
  // No revalidatePath here on purpose. Account pages are already fetched with
  // `cache: 'no-store'`, so there is nothing cached to purge — but the call
  // still forces Next.js to render the destination *inside* the action before
  // the browser is allowed to navigate. That is what left the sign-in button
  // spinning for over 30 seconds with no error and no transition (QA-05).
  redirect(sanitizeRedirect(redirectTo))
}

/* -------------------------------------------------------------------------- */
/*  Register                                                                   */
/* -------------------------------------------------------------------------- */

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isWpConfigured()) return fail('not_configured')

  const email = text(formData, 'email')
  const username = text(formData, 'username') || email
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')
  const firstName = text(formData, 'firstName')
  const lastName = text(formData, 'lastName')

  const fieldErrors: AuthActionState['fieldErrors'] = {}
  if (!email) fieldErrors.email = 'missing_fields'
  else if (!looksLikeEmail(email)) fieldErrors.email = 'invalid_email'
  if (!password) fieldErrors.password = 'missing_fields'
  else if (password.length < 8) fieldErrors.password = 'weak_password'
  if (password !== confirm) fieldErrors.confirmPassword = 'password_mismatch'
  if (Object.keys(fieldErrors).length) {
    return fail(fieldErrors.confirmPassword ?? 'missing_fields', fieldErrors)
  }

  try {
    await wpFetch<{ registerUser: { user: { databaseId: number } | null } | null }>(
      REGISTER_USER,
      { username, email, password, firstName, lastName }
    )
  } catch (error) {
    return fail(codeOf(error))
  }

  // From here on the WordPress account EXISTS. Auto-login is a convenience and
  // its failure must never be reported as a failed registration — otherwise the
  // visitor retries and hits "email already exists" on an account that is
  // genuinely theirs. This is exactly what happens when the WPGraphQL JWT
  // Authentication plugin is absent (no `login` field in the schema) or when the
  // site requires email confirmation before first sign-in.
  let signedIn = false
  try {
    const loginData = await wpFetch<{
      login: { authToken: string | null; refreshToken: string | null } | null
    }>(LOGIN, { username, password })

    const authToken = loginData.login?.authToken
    const refreshToken = loginData.login?.refreshToken

    if (authToken && refreshToken) {
      await setSessionCookies({ authToken, refreshToken })
      signedIn = true
    }
  } catch (error) {
    console.log(
      '[v0] Account created but auto-login is unavailable:',
      codeOf(error)
    )
  }

  // See the note in loginAction: revalidating here only delays the redirect.
  // `registered=1` makes the sign-in page explain that the account is ready and
  // only the automatic sign-in step was skipped.
  redirect(signedIn ? '/account' : '/account/login?registered=1')
}

/* -------------------------------------------------------------------------- */
/*  Sign out                                                                   */
/* -------------------------------------------------------------------------- */

export async function logoutAction() {
  await clearSessionCookies()
  revalidatePath('/', 'layout')
  redirect('/account/login')
}

/* -------------------------------------------------------------------------- */
/*  Forgot password                                                            */
/* -------------------------------------------------------------------------- */

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isWpConfigured()) return fail('not_configured')

  const username = identifier(formData)
  if (!username) {
    return fail('missing_fields', { usernameOrEmail: 'missing_fields' })
  }

  try {
    await wpFetch(SEND_PASSWORD_RESET, { username })
  } catch (error) {
    const code = codeOf(error)
    // WordPress deliberately reveals whether an account exists here. We do not
    // pass that on — an unknown user still gets the neutral success screen.
    if (code === 'invalid_credentials' || code === 'unknown') {
      return { status: 'success' }
    }
    return fail(code)
  }

  return { status: 'success' }
}

/* -------------------------------------------------------------------------- */
/*  Update profile                                                             */
/* -------------------------------------------------------------------------- */

export async function updateProfileAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isWpConfigured()) return fail('not_configured')

  const firstName = text(formData, 'firstName')
  const lastName = text(formData, 'lastName')
  const email = text(formData, 'email')
  const password = String(formData.get('newPassword') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')

  const fieldErrors: AuthActionState['fieldErrors'] = {}
  if (!email) fieldErrors.email = 'missing_fields'
  else if (!looksLikeEmail(email)) fieldErrors.email = 'invalid_email'
  if (password && password.length < 8) fieldErrors.newPassword = 'weak_password'
  if (password && password !== confirm) {
    fieldErrors.confirmPassword = 'password_mismatch'
  }
  if (Object.keys(fieldErrors).length) {
    return fail(
      fieldErrors.confirmPassword ?? fieldErrors.newPassword ?? 'invalid_email',
      fieldErrors
    )
  }

  try {
    const authToken = await getAuthToken()
    if (!authToken) return fail('not_logged_in')

    await wpFetch(
      UPDATE_CUSTOMER_PROFILE,
      {
        firstName,
        lastName,
        email,
        // Only send a password when the visitor actually typed a new one.
        ...(password ? { password } : {}),
      },
      { authToken }
    )
  } catch (error) {
    return fail(codeOf(error))
  }

  revalidatePath('/account')
  revalidatePath('/account/profile')
  return { status: 'success' }
}

/* -------------------------------------------------------------------------- */
/*  Update addresses                                                           */
/* -------------------------------------------------------------------------- */

const ADDRESS_KEYS = [
  'firstName',
  'lastName',
  'company',
  'address1',
  'address2',
  'city',
  'state',
  'postcode',
  'country',
  'phone',
] as const

function readAddress(formData: FormData, prefix: 'billing' | 'shipping') {
  const address: Record<string, string> = {}
  for (const key of ADDRESS_KEYS) {
    address[key] = text(formData, `${prefix}_${key}`)
  }
  if (prefix === 'billing') {
    const email = text(formData, 'billing_email')
    if (email) address.email = email
  }
  return address
}

export async function updateAddressesAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isWpConfigured()) return fail('not_configured')

  const billing = readAddress(formData, 'billing')
  const shipping = readAddress(formData, 'shipping')

  if (billing.email && !looksLikeEmail(billing.email)) {
    return fail('invalid_email', { billing_email: 'invalid_email' })
  }

  try {
    const authToken = await getAuthToken()
    if (!authToken) return fail('not_logged_in')

    await wpFetch(
      UPDATE_CUSTOMER_ADDRESSES,
      { billing, shipping },
      { authToken }
    )
  } catch (error) {
    return fail(codeOf(error))
  }

  revalidatePath('/account/addresses')
  return { status: 'success' }
}

/** Blocks open-redirects: only same-site paths are honoured. */
function sanitizeRedirect(target: string) {
  if (!target.startsWith('/') || target.startsWith('//')) return '/account'
  return target
}
