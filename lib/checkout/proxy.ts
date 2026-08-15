import 'server-only'

import { headers } from 'next/headers'
import { wpStoreOrigin } from '@/lib/wp/config'
import { LOCALE_STORAGE_KEY, isLocale, type Locale } from '@/lib/i18n/config'

const CMS_PATH_PREFIX = '/cms'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function localeFromRequest(request: Request): Locale {
  const requested = new URL(request.url).searchParams.get('locale') ?? new URL(request.url).searchParams.get('lang')
  if (isLocale(requested)) return requested

  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(new RegExp(`${escapeRegExp(LOCALE_STORAGE_KEY)}=([^;]+)`))
  return isLocale(match?.[1]) ? match[1] : 'en'
}

function frontendOrigin(request: Request) {
  return new URL(request.url).origin
}

function mapCmsPath(pathname: string) {
  const path = pathname || '/'

  // WordPress theme navigation points at legacy pages. Keep those links on
  // the native Next.js site instead of exposing the CMS fallback under /cms.
  if (path === '/' || path === '') return '/'
  if (path === '/shop' || path === '/shop/') return '/products'
  if (path === '/cart' || path === '/cart/') return '/cart'
  if (path === '/checkout' || path.startsWith('/checkout/')) return path
  if (path === '/blog-he' || path === '/blog-he/' || path === '/he/blog-he' || path === '/he/blog-he/') return '/blog'
  if (path === '/contact-he' || path === '/contact-he/' || path === '/he/contact-he' || path === '/he/contact-he/') return '/contact'
  if (
    path === '/car-import-he' ||
    path === '/car-import-he/' ||
    path === '/he/car-import-he' ||
    path === '/he/car-import-he/' ||
    path === '/personal-import-he' ||
    path === '/personal-import-he/' ||
    path === '/he/personal-import-he' ||
    path === '/he/personal-import-he/'
  ) return '/cars'
  if (path === '/en/home-en' || path === '/en/home-en/') return '/?locale=en'
  if (path === '/ar/home-ar' || path === '/ar/home-ar/') return '/?locale=ar'
  if (path === '/he/home-he' || path === '/he/home-he/') return '/?locale=he'
  if (path === '/about-he' || path === '/about-he/' || path === '/he/about-he' || path === '/he/about-he/') return '/'
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
  const mappedUrl = new URL(mapped, 'http://next.local')
  for (const [key, value] of parsed.searchParams) {
    if (!mappedUrl.searchParams.has(key)) mappedUrl.searchParams.append(key, value)
  }
  return `${mappedUrl.pathname}${mappedUrl.search}${parsed.hash || mappedUrl.hash}`
}

function rewriteHtml(html: string, request: Request, isCheckoutPath = false) {
  const attributePattern = /\b(href|src|action|formaction|poster)=("|')(.*?)\2/gi
  const rewritten = html.replace(attributePattern, (_match, name: string, quote: string, value: string) => {
    return `${name}=${quote}${rewriteCmsUrl(value, request)}${quote}`
  })

  const cmsOrigin = wpStoreOrigin()
  const withLocalLinks = cmsOrigin
    ? rewritten.replace(
        new RegExp(`${escapeRegExp(cmsOrigin)}([^\\s"'<>)]*)`, 'g'),
        (_match, suffix: string) => rewriteCmsUrl(`${cmsOrigin}${suffix}`, request)
      )
    : rewritten

  if (!isCheckoutPath) return withLocalLinks

  const locale = localeFromRequest(request)
  const labels = {
    en: 'Back to home',
    ar: 'العودة إلى الصفحة الرئيسية',
    he: 'חזרה לדף הבית',
  } as const
  const direction = locale === 'en' ? 'ltr' : 'rtl'
  const returnControl = `<div data-alifleet-checkout-return style="box-sizing:border-box;max-width:1100px;margin:0 auto;padding:24px 24px 0;direction:${direction};"><a href="/?locale=${locale}" style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(45,58,107,.18);border-radius:999px;padding:11px 18px;color:#2d3a6b;background:#fff;text-decoration:none;font:600 14px/1.2 Arial,sans-serif;">${labels[locale]}</a></div>`
  const withoutWordPressChrome = withLocalLinks
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')

  return withoutWordPressChrome.replace(/<body\b[^>]*>/i, (bodyTag) => `${bodyTag}${returnControl}`)
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
  const locale = localeFromRequest(request)
  const targetPath = isCheckoutPath && !joinedPath.endsWith('/') ? `${joinedPath}/` : joinedPath
  const target = new URL(targetPath, cmsOrigin)
  target.search = incomingUrl.search
  if (isCheckoutPath) {
    // Polylang understands `lang`; the storefront uses `locale`. Normalize the
    // request so WooCommerce renders the same language as the Next.js site.
    target.searchParams.delete('locale')
    target.searchParams.set('lang', locale)
  }

  const requestHeaders = new Headers()
  const incomingCookie = request.headers.get('cookie') ?? ''
  if (incomingCookie) requestHeaders.set('cookie', incomingCookie)
  requestHeaders.set('accept', request.headers.get('accept') ?? '*/*')
  requestHeaders.set(
    'accept-language',
    isCheckoutPath ? `${locale},en;q=0.8` : request.headers.get('accept-language') ?? ''
  )
  requestHeaders.set('x-alifleet-frontend-origin', frontendOrigin(request))
  requestHeaders.set('x-alifleet-locale', locale)
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
    return new Response(rewriteHtml(html, request, isCheckoutPath), {
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
