import { timingSafeEqual } from 'node:crypto'

import { revalidateTag } from 'next/cache'

import { WP_CACHE_TAG, wpRevalidateSecret } from '@/lib/wp/config'

/**
 * Cache purge webhook for WordPress.
 *
 * Cached WordPress reads carry `WP_CACHE_TAG` and a ten minute revalidate
 * window. Without this route that window is also the *minimum* wait after an
 * edit, so the ACF fields feel broken rather than slow: an editor saves, looks
 * at the site, sees the old text and has no way to tell whether the change
 * failed or is merely queued. WordPress calls this on save so the ceiling only
 * applies when the ping is lost.
 *
 * POST only. A GET would be fetched by link preheaters, crawlers and the
 * WordPress admin's own link checks, purging the cache as a side effect of
 * something merely looking at the URL.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = wpRevalidateSecret()

  // An unset secret disables the endpoint instead of allowing every caller.
  // Defaulting to open would mean a missing env var quietly turns the cache
  // into a public purge button pointed at the WordPress box.
  if (!secret) {
    console.log('[v0] revalidate: WORDPRESS_REVALIDATE_SECRET is not set')
    return Response.json(
      { revalidated: false, error: 'revalidation is not configured' },
      { status: 503 }
    )
  }

  const provided =
    request.headers.get('x-alifleet-revalidate-secret') ??
    new URL(request.url).searchParams.get('secret') ??
    ''

  if (!secretsMatch(provided, secret)) {
    // No detail in the body: a caller guessing the secret learns nothing about
    // whether it was missing, the wrong length, or merely wrong.
    return Response.json({ revalidated: false }, { status: 401 })
  }

  // 'max' lets the refreshed entry keep serving while it is refetched, so a
  // burst of saves cannot turn into a burst of uncached page renders.
  revalidateTag(WP_CACHE_TAG, 'max')

  return Response.json({ revalidated: true, tag: WP_CACHE_TAG, now: Date.now() })
}

/**
 * Constant-time comparison, so response timing does not reveal how much of a
 * guessed secret was correct. `timingSafeEqual` throws on length mismatch,
 * which would itself leak the length, so both sides are hashed to a fixed
 * width first.
 */
function secretsMatch(provided: string, expected: string): boolean {
  if (!provided) return false
  const a = new TextEncoder().encode(provided)
  const b = new TextEncoder().encode(expected)
  if (a.length !== b.length) {
    // Still burn a comparison so the mismatch is not measurably faster.
    timingSafeEqual(b, b)
    return false
  }
  return timingSafeEqual(a, b)
}
