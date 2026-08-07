import { type NextRequest, NextResponse } from 'next/server'

/**
 * /api/img?url=<encoded-absolute-url>
 *
 * Proxies images from the WordPress server so the browser never hits
 * an http:// origin from an https:// page (mixed-content block).
 * Only URLs whose hostname matches the configured WORDPRESS_GRAPHQL_ENDPOINT
 * are forwarded; every other host gets a 400 to prevent open-redirect abuse.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) return new NextResponse('Missing url param', { status: 400 })

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  // Only proxy images from the configured WordPress host.
  const endpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? ''
  let allowedHost = ''
  try {
    allowedHost = new URL(endpoint).hostname
  } catch {
    /* endpoint not set — deny everything */
  }

  if (!allowedHost || target.hostname !== allowedHost) {
    return new NextResponse('Forbidden host', { status: 400 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'AliFleet-NextJS-Image-Proxy/1.0' },
      next: { revalidate: 86400 }, // cache 24 h on the CDN edge
    })

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('[img-proxy] fetch error', err)
    return new NextResponse('Proxy error', { status: 502 })
  }
}
