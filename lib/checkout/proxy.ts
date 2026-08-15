import 'server-only'

import { headers } from 'next/headers'
import { wpStoreOrigin } from '@/lib/wp/config'
import { LOCALE_STORAGE_KEY, isLocale, type Locale } from '@/lib/i18n/config'

const CMS_PATH_PREFIX = '/cms'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function localeFromRequest(request: Request): Locale {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(new RegExp(`${escapeRegExp(LOCALE_STORAGE_KEY)}=([^;]+)`))
  return isLocale(match?.[1]) ? match[1] : 'en'
}

function frontendOrigin(request: Request) {
  return new URL(request.url).origin
}

function mapCmsPath(pathname: string) {
  const path = pathname || '/'

  if (path === '/shop' || path === '/shop/') return '/products'
  if (path === '/cart' || path === '/cart/') return '/cart'
  if (path === '/checkout' || path.startsWith('/checkout/')) return path
  if (path === '/my-account' || path === '/my-account/') return '/account'
  if (path.startsWith('/my-account/')) {
    const rest = path.slice('/my-account/'.length)
    if (rest === 'orders' || rest.startsWith('view-order')) return `/account/orders${rest.startsWith('view-order') ? `/${rest.slice('view-order/'.length)}` : ''}`
    if (rest === 'edit-account') return '/account/profile'
    if (rest === 'edit-address' || rest.startsWith('edit-address/')) return '/account/addresses'
    return '/account'
  }
  if (path.startsWith('/product/')) return `/products/${path.slice('/product/'.length)}`

  return `${CMS_PATH_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
}

export function rewriteCmsUrl(value: string, request: Request): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('#')) return value
  if (/^(data:|mailto:|tel:|javascript:|blob:)/i.test(trimmed)) return value

  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) return value

  let parsed: URL
  try {
    parsed = new URL(trimmed, cmsOrigin)
  } catch {
    return value
  }

  const isCmsOrigin = parsed.origin === cmsOrigin
  const isRelative = !/^[a-z][a-z\d+.-]*:/i.test(trimmed) && trimmed.startsWith('/')
  if (!isCmsOrigin && !isRelative) return value

  const mapped = mapCmsPath(parsed.pathname)
  return `${mapped}${parsed.search}${parsed.hash}`
}

function rewriteHtml(html: string, request: Request) {
  const attributePattern = /\b(href|src|action|formaction|poster)=(["'])(.*?)\2/gi
  const rewritten = html.replace(attributePattern, (_match, name: string, quote: string, value: string) => {
    return `${name}=${quote}${rewriteCmsUrl(value, request)}${quote}`
  })

  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) return rewritten

  const absolutePattern = new RegExp(`${escapeRegExp(cmsOrigin)}([^\\s"'<>)]*)`, 'g')
  return rewritten.replace(absolutePattern, (_match, suffix: string) => {
    return rewriteCmsUrl(`${cmsOrigin}${suffix}`, request)
  })
}

function copyResponseHeaders(source: Headers) {
  const headers = new Headers()
  for (const name of ['content-type', 'cache-control', 'etag', 'last-modified', 'vary']) {
    const value = source.get(name)
    if (value) headers.set(name, value)
  }
  return headers
}

function setCookiesFrom(response: Response) {
  const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof responseHeaders.getSetCookie === 'function') return responseHeaders.getSetCookie()
  const single = response.headers.get('set-cookie')
  return single ? [single] : []
}

function frontendSetCookie(raw: string) {
  const attributes = raw.split(';').map((part) => part.trim())
  const pair = attributes.shift()
  if (!pair) return ''

  const kept = attributes.filter((attribute) => {
    const name = attribute.split('=', 1)[0].toLowerCase()
    return name !== 'domain' && name !== 'path'
  })
  return [pair, 'Path=/', ...kept].join('; ')
}

function cookieHeader(existing: string, setCookies: string[]) {
  const pairs = setCookies.map((cookie) => cookie.split(';', 1)[0]).filter(Boolean)
  return [existing, ...pairs].filter(Boolean).join('; ')
}

export async function proxyWooRequest(request: Request, path: string[]) {
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) return new Response('WordPress checkout is not configured.', { status: 503 })

  const incomingUrl = new URL(request.url)
  const joinedPath = `/${path.filter(Boolean).join('/')}`
  const isCheckoutPath = path[0] === 'checkout'
  const targetPath = isCheckoutPath && !joinedPath.endsWith('/') ? `${joinedPath}/` : joinedPath
  const target = new URL(targetPath, cmsOrigin)
  target.search = incomingUrl.search

  const requestHeaders = new Headers()
  const incomingCookie = request.headers.get('cookie') ?? ''
  if (incomingCookie) requestHeaders.set('cookie', incomingCookie)
  requestHeaders.set('accept', request.headers.get('accept') ?? '*/*')
  requestHeaders.set('accept-language', request.headers.get('accept-language') ?? '')
  requestHeaders.set('x-alifleet-frontend-origin', frontendOrigin(request))
  requestHeaders.set('x-alifleet-locale', localeFromRequest(request))
  requestHeaders.set('accept-encoding', 'identity')

  const method = request.method.toUpperCase()
  const init: RequestInit = { method, headers: requestHeaders, redirect: 'manual' }
  if (method !== 'GET' && method !== 'HEAD') init.body = await request.arrayBuffer()

  const upstream = await fetch(target, init)
  const upstreamCookies = setCookiesFrom(upstream)
  const responseHeaders = copyResponseHeaders(upstream.headers)
  for (const cookie of upstreamCookies) {
    const normalized = frontendSetCookie(cookie)
    if (normalized) responseHeaders.append('set-cookie', normalized)
  }

  const location = upstream.headers.get('location')
  if (location && upstream.status >= 300 && upstream.status < 400) {
    // WooCommerce normally sends an empty checkout back to the cart. On this
    // install WordPress currently emits /wp-admin/ instead; following that
    // redirect through the proxy creates an avoidable /cms/wp-admin loop.
    // Keep this fallback scoped to checkout requests so genuine CMS/admin
    // redirects elsewhere are not changed.
    let rewrittenLocation = rewriteCmsUrl(location, request)
    if (isCheckoutPath) {
      try {
        const locationUrl = new URL(location, cmsOrigin)
        if (locationUrl.pathname === '/wp-admin' || locationUrl.pathname === '/wp-admin/') {
          rewrittenLocation = `/cart${locationUrl.search}${locationUrl.hash}`
        }
      } catch {
        // Keep the generic CMS rewrite when WordPress returns a malformed URL.
      }
    }
    responseHeaders.set('location', rewrittenLocation)
    return new Response(null, { status: upstream.status, headers: responseHeaders })
  }

  const contentType = upstream.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    const html = await upstream.text()
    responseHeaders.delete('content-length')
    return new Response(rewriteHtml(html, request), {
      status: upstream.status,
      headers: responseHeaders,
    })
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function createWooSessionHandoff(request: Request, authToken: string, locale: Locale) {
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) throw new Error('WordPress checkout is not configured.')

  const response = await fetch(`${cmsOrigin}/wp-json/alifleet/v1/session`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
      'x-alifleet-frontend-origin': frontendOrigin(request),
      'x-alifleet-locale': locale,
      accept: 'application/json',
    },
    body: JSON.stringify({ locale }),
    redirect: 'manual',
  })

  if (!response.ok) throw new Error(`Checkout session handoff failed (${response.status}).`)
  return setCookiesFrom(response)
}

export function setCookiesOnResponse(response: Response, cookiesToSet: string[]) {
  for (const cookie of cookiesToSet) response.headers.append('set-cookie', cookie)
  return response
}

export function mergeCookies(existing: string, setCookies: string[]) {
  return cookieHeader(existing, setCookies)
}

export function normalizeSetCookie(raw: string) {
  return frontendSetCookie(raw)
}

export async function requestHeadersForCheckout(request: Request) {
  const incoming = await headers()
  return {
    cookie: request.headers.get('cookie') ?? '',
    origin: incoming.get('origin') ?? frontendOrigin(request),
  }
}

export function localeForRequest(request: Request): Locale {
  return localeFromRequest(request)
}
