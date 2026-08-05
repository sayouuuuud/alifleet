/**
 * The site runs in three languages, so error text is never passed from the
 * server to the browser. Server actions return a stable `AuthErrorCode`
 * instead and the client renders `t.account.errors[code]`.
 */
export type AuthErrorCode =
  | 'not_configured'
  | 'network'
  | 'missing_fields'
  | 'invalid_credentials'
  | 'invalid_email'
  | 'email_exists'
  | 'username_exists'
  | 'weak_password'
  | 'password_mismatch'
  | 'registration_disabled'
  | 'session_expired'
  | 'not_logged_in'
  | 'woo_missing'
  | 'reset_unavailable'
  | 'unknown'

/** Thrown when a WPGraphQL request fails, carrying a translatable code. */
export class WpError extends Error {
  readonly code: AuthErrorCode
  /** Raw messages from WordPress — logged on the server, never shown as-is. */
  readonly details: string[]

  constructor(code: AuthErrorCode, details: string[] = []) {
    super(`[wp:${code}] ${details.join(' | ')}`)
    this.name = 'WpError'
    this.code = code
    this.details = details
  }
}

/**
 * WPGraphQL surfaces most failures as human-readable strings rather than
 * machine codes, so we pattern-match them into our own taxonomy. Matching is
 * done on a lowercased haystack of every message plus any extension code.
 */
export function classifyWpErrors(messages: string[]): AuthErrorCode {
  const haystack = messages.join(' ').toLowerCase()

  const has = (...needles: string[]) => needles.some((n) => haystack.includes(n))

  // The JWT plugin is missing or the schema has no `login` field at all.
  if (
    has(
      'cannot query field "login"',
      'cannot query field \'login\'',
      'unknown field "login"',
      'field "authtoken"',
      'jwt_auth_secret_key',
      'jwt auth secret'
    )
  ) {
    return 'not_configured'
  }

  // WooGraphQL is not installed, so `customer` does not exist.
  if (
    has(
      'cannot query field "customer"',
      'unknown field "customer"',
      'cannot query field "updatecustomer"'
    )
  ) {
    return 'woo_missing'
  }

  // "Anyone can register" is switched off in WordPress settings.
  if (
    has(
      'user registration is not allowed',
      'registration is disabled',
      'not allowed to register',
      'cannot query field "registeruser"',
      'sorry, you are not allowed to create users'
    )
  ) {
    return 'registration_disabled'
  }

  if (has('incorrect_password', 'incorrect password', 'invalid_username', 'unknown username', 'invalid username', 'the password you entered')) {
    return 'invalid_credentials'
  }

  if (has('existing_user_email', 'email address is already', 'email already exists')) {
    return 'email_exists'
  }

  if (has('existing_user_login', 'username already exists', 'username is already')) {
    return 'username_exists'
  }

  if (has('invalid_email', 'not a valid email', 'email address isn')) {
    return 'invalid_email'
  }

  if (has('empty_password', 'password is required', 'password too short')) {
    return 'weak_password'
  }

  if (
    has(
      'expired',
      'signature verification failed',
      'invalid-jwt',
      'invalid jwt',
      'wp_jwt_token_invalid',
      'the iss do not match'
    )
  ) {
    return 'session_expired'
  }

  if (has('not authorized', 'unauthorized', 'must be logged in', 'sorry, you are not allowed')) {
    return 'not_logged_in'
  }

  if (has('cannot query field "sendpasswordresetemail"')) {
    return 'reset_unavailable'
  }

  return 'unknown'
}
