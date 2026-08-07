/**
 * Returns a URL that goes through the /api/img proxy when the source
 * is an http:// URL, so the browser never fires a mixed-content request.
 *
 * On the server side (SSR) the original URL is returned as-is because
 * server-to-server fetches are not subject to mixed-content restrictions.
 */
export function proxied(src: string | null | undefined): string {
  if (!src) return '/placeholder.svg'

  // Already relative or https — safe to use directly.
  if (!src.startsWith('http://')) return src

  return `/api/img?url=${encodeURIComponent(src)}`
}
