import 'server-only'

import { headers } from 'next/headers'
import { BodyLimitExceededError, decodeUtf8, readBodyWithLimit } from '@/lib/http-limits'
import { wpStoreOrigin } from '@/lib/wp/config'
import { LOCALE_STORAGE_KEY, isLocale, type Locale } from '@/lib/i18n/config'
import {
  CART_QUANTITY_COOKIE,
  CART_STORAGE_KEY,
  isOrderReceivedPath,
  isWooStateCookie,
} from './gate'

const CMS_PATH_PREFIX = '/cms'
const UPSTREAM_TIMEOUT_MS = 20_000
const REQUEST_BODY_LIMIT_BYTES = 512 * 1024
const UPSTREAM_TEXT_LIMIT_BYTES = 3 * 1024 * 1024
const UPSTREAM_ASSET_LIMIT_BYTES = 12 * 1024 * 1024
const PRIVATE_NO_STORE = 'private, no-store, max-age=0, must-revalidate'
const PRODUCTION_ORIGIN = 'https://alifleet.com'
const STATIC_ASSET_EXTENSION = /\.(?:avif|css|eot|gif|ico|jpe?g|js|mjs|otf|png|svg|ttf|webp|woff2?)$/i
const UPLOAD_IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i
const ALLOWED_WC_AJAX_ACTIONS = new Set([
  'apply_coupon',
  'checkout',
  'get_refreshed_fragments',
  'remove_coupon',
  'update_order_review',
])

function privateNoStoreHeaders(headers = new Headers()) {
  headers.set('cache-control', PRIVATE_NO_STORE)
  headers.set('pragma', 'no-cache')
  headers.set('expires', '0')
  headers.delete('etag')
  headers.delete('last-modified')
  return headers
}

function checkoutUnavailableResponse(request: Request, ajax = false) {
  const responseHeaders = privateNoStoreHeaders()
  if (ajax) {
    responseHeaders.set('content-type', 'application/json; charset=utf-8')
    return new Response(
      JSON.stringify({
        result: 'failure',
        messages: 'Checkout is temporarily unavailable. Please try again.',
      }),
      { status: 503, headers: responseHeaders }
    )
  }

  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD') {
    responseHeaders.set('location', '/cart?checkout=unavailable')
    return new Response(null, { status: 303, headers: responseHeaders })
  }

  responseHeaders.set('content-type', 'text/plain; charset=utf-8')
  return new Response('Checkout is temporarily unavailable. Please try again.', {
    status: 503,
    headers: responseHeaders,
  })
}

export async function fetchWooUpstream(
  input: Parameters<typeof fetch>[0],
  init: RequestInit = {}
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

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

function notFoundResponse() {
  return new Response(null, {
    status: 404,
    headers: { 'cache-control': 'private, no-store, max-age=0' },
  })
}

function requestTooLargeResponse(ajax = false) {
  const responseHeaders = privateNoStoreHeaders()
  responseHeaders.set('content-type', ajax ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8')
  const body = ajax
    ? JSON.stringify({ result: 'failure', messages: 'Request is too large.' })
    : 'Request is too large.'
  return new Response(body, { status: 413, headers: responseHeaders })
}

function upstreamTooLargeResponse(ajax = false) {
  const responseHeaders = privateNoStoreHeaders()
  responseHeaders.set('content-type', ajax ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8')
  const body = ajax
    ? JSON.stringify({ result: 'failure', messages: 'Checkout response was invalid.' })
    : 'Upstream response was invalid.'
  return new Response(body, { status: 502, headers: responseHeaders })
}

function isSafePath(path: string[]) {
  return path.every((segment) => {
    try {
      const decoded = decodeURIComponent(segment)
      return decoded !== '.' && decoded !== '..' && !decoded.includes('\\') && !decoded.includes('\0')
    } catch {
      return false
    }
  })
}

function isStaticAssetPath(pathname: string, path: string[]) {
  if (!isSafePath(path)) return false
  if (pathname.startsWith('/wp-content/uploads/')) {
    return UPLOAD_IMAGE_EXTENSION.test(pathname)
  }
  const allowedRoot = pathname.startsWith('/wp-content/') || pathname.startsWith('/wp-includes/')
  return allowedRoot && STATIC_ASSET_EXTENSION.test(pathname)
}

function isTrustedWriteOrigin(request: Request) {
  const source = request.headers.get('origin') ?? request.headers.get('referer')
  if (!source || source === 'null') return false
  try {
    return new URL(source).origin === frontendOrigin(request)
  } catch {
    return false
  }
}

function isAllowedCheckoutCookie(name: string) {
  return isWooStateCookie(name) || name === 'pll_language' || name === LOCALE_STORAGE_KEY
}

function filterCheckoutCookies(raw: string) {
  return raw
    .split(';')
    .map((part) => part.trim())
    .filter((part) => {
      const separator = part.indexOf('=')
      return separator > 0 && isAllowedCheckoutCookie(part.slice(0, separator).trim())
    })
    .join('; ')
}

function isAllowedSetCookie(raw: string) {
  const pair = raw.split(';', 1)[0]
  const separator = pair.indexOf('=')
  return separator > 0 && isAllowedCheckoutCookie(pair.slice(0, separator).trim())
}

/**
 * The browser origin is derived only from explicit configuration, the actual
 * request URL, or Vercel's deployment hostname. Forwarded host headers are not
 * accepted because callers can supply them outside the trusted Vercel edge.
 */
const CONFIGURED_ORIGIN = normalizeOrigin(
  process.env.SITE_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_ORIGIN ?? ''
)

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''
    return url.origin
  } catch {
    return ''
  }
}

function isTrustedStorefrontHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  return (
    normalized === 'alifleet.com' ||
    normalized === 'www.alifleet.com' ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1'
  )
}

export function frontendOrigin(request: Request) {
  if (CONFIGURED_ORIGIN) return CONFIGURED_ORIGIN

  try {
    const requestUrl = new URL(request.url)
    if (isTrustedStorefrontHost(requestUrl.hostname)) return requestUrl.origin
  } catch {
    // Fall through to the platform hostname or the production origin.
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercelHost) {
    const platformOrigin = normalizeOrigin(`https://${vercelHost}`)
    if (platformOrigin && isTrustedStorefrontHost(new URL(platformOrigin).hostname)) {
      return platformOrigin
    }
  }

  return PRODUCTION_ORIGIN
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

  // Legal & Policy pages
  if (path === '/privacy-policy' || path === '/privacy-policy/' || path === '/privacy' || path === '/privacy/') return '/privacy-policy'
  if (path === '/privacy-policy-ar' || path === '/privacy-policy-ar/' || path === '/ar/privacy-policy-ar' || path === '/ar/privacy-policy-ar/') return '/privacy-policy?locale=ar'
  if (path === '/privacy-policy-en' || path === '/privacy-policy-en/' || path === '/en/privacy-policy-en' || path === '/en/privacy-policy-en/') return '/privacy-policy?locale=en'
  if (path === '/privacy-policy-he' || path === '/privacy-policy-he/' || path === '/he/privacy-policy-he' || path === '/he/privacy-policy-he/') return '/privacy-policy?locale=he'

  if (path === '/terms' || path === '/terms/' || path === '/terms-and-conditions' || path === '/terms-and-conditions/') return '/terms'
  if (path === '/terms-ar' || path === '/terms-ar/' || path === '/ar/terms-ar' || path === '/ar/terms-ar/') return '/terms?locale=ar'
  if (path === '/terms-en' || path === '/terms-en/' || path === '/en/terms-en' || path === '/en/terms-en/') return '/terms?locale=en'
  if (path === '/terms-he' || path === '/terms-he/' || path === '/he/terms-he' || path === '/he/terms-he/') return '/terms?locale=he'

  if (path === '/return-policy' || path === '/return-policy/' || path === '/refund_returns' || path === '/refund_returns/' || path === '/refund-returns' || path === '/refund-returns/') return '/return-policy'
  if (path === '/return-policy-ar' || path === '/return-policy-ar/' || path === '/ar/return-policy-ar' || path === '/ar/return-policy-ar/') return '/return-policy?locale=ar'
  if (path === '/return-policy-en' || path === '/return-policy-en/' || path === '/en/return-policy-en' || path === '/en/return-policy-en/') return '/return-policy?locale=en'
  if (path === '/return-policy-he' || path === '/return-policy-he/' || path === '/he/return-policy-he' || path === '/he/return-policy-he/') return '/return-policy?locale=he'

  return `${CMS_PATH_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
}

export function rewriteCmsUrl(value: string, _request: Request): string {
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

/**
 * WooCommerce emits its AJAX endpoints as root-relative `/?wc-ajax=<action>`.
 * Served from the Next.js origin those hit the storefront home page instead of
 * WordPress, which silently kills checkout.js: no order review refresh, no
 * inline validation, and "place order" degrades into a raw form POST. Point
 * them at the dedicated proxy route instead.
 */
function rewriteAjaxEndpoints(html: string) {
  return html
    .replace(/\/\?wc-ajax=/g, '/wc-ajax?wc-ajax=')
    .replace(/\\\/\?wc-ajax=/g, '\\/wc-ajax?wc-ajax=')
    .replace(/(?<!\/cms)\/wp-admin\/admin-ajax\.php/g, '/cms/wp-admin/admin-ajax.php')
    .replace(/(?<!\\\/cms)\\\/wp-admin\\\/admin-ajax\.php/g, '\\/cms\\/wp-admin\\/admin-ajax.php')
}

/**
 * Any absolute link back to this storefront becomes relative, so a stale or
 * wrong origin baked into WordPress output (localhost, or the origin of an
 * earlier deploy) can never send a customer off the live site mid-checkout.
 */
function stripFrontendOrigins(html: string, origin: string) {
  const withoutInternal = html
    .replace(/https?:\/\/localhost(?::\d+)?/gi, '')
    .replace(/https?:\\\/\\\/localhost(?::\d+)?/gi, '')

  if (!origin) return withoutInternal
  const escaped = escapeRegExp(origin)
  return withoutInternal
    .replace(new RegExp(escaped, 'g'), '')
    .replace(new RegExp(escapeRegExp(origin.replace(/\//g, '\\/')), 'g'), '')
}

function rewriteHtml(html: string, request: Request, isCheckoutPath = false) {
  const attributePattern = /\b(href|src|action|formaction|poster)=("|')(.*?)\2/gi
  const rewritten = html.replace(attributePattern, (_match, name: string, quote: string, value: string) => {
    return `${name}=${quote}${rewriteCmsUrl(value, request)}${quote}`
  })

  // A backslash must end the URL match. WooCommerce localizes its checkout
  // strings as JSON inside <script>, e.g. `href=\"https://a-f.site/my-account/\"`;
  // swallowing that `\` into the URL removed the escape, turned the JSON into a
  // SyntaxError and left `wc_checkout_params` undefined, which silently disabled
  // every piece of checkout JavaScript (order review, shipping, AJAX submit).
  const cmsOrigin = wpStoreOrigin()
  const withCmsLinks = cmsOrigin
    ? rewritten.replace(
        new RegExp(`${escapeRegExp(cmsOrigin)}([^\\s"'<>)\\\\]*)`, 'g'),
        (_match, suffix: string) => rewriteCmsUrl(`${cmsOrigin}${suffix}`, request)
      )
    : rewritten

  const withLocalLinks = rewriteAjaxEndpoints(
    stripFrontendOrigins(withCmsLinks, frontendOrigin(request))
  )

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

function copyResponseHeaders(source: Headers, isStaticAsset = false) {
  const responseHeaders = new Headers()
  for (const name of ['content-type', 'vary']) {
    const value = source.get(name)
    if (value) responseHeaders.set(name, value)
  }

  if (isStaticAsset) {
    responseHeaders.set('cache-control', 'public, max-age=86400, stale-while-revalidate=604800')
    responseHeaders.set('x-content-type-options', 'nosniff')
    return responseHeaders
  }

  return privateNoStoreHeaders(responseHeaders)
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

/**
 * Forces Polylang's language cookie to agree with the locale the storefront
 * asked for. Polylang prefers `pll_language` over the `lang` query parameter,
 * so a cookie left behind by an earlier visit made WordPress render checkout in
 * the wrong language — Hebrew chrome on an English order (QA-05).
 */
function alignPolylangCookie(cookie: string, locale: Locale) {
  const pairs = cookie
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && !/^pll_language=/i.test(part))

  pairs.push(`pll_language=${locale}`)
  return pairs.join('; ')
}

function cookieHeader(existing: string, setCookies: string[]) {
  const pairs = setCookies.map((cookie) => cookie.split(';', 1)[0]).filter(Boolean)
  return [existing, ...pairs].filter(Boolean).join('; ')
}

/**
 * Empties the storefront's localStorage cart on the order confirmation page.
 * Kept inline because the confirmation is proxied WordPress markup, so none of
 * the Next.js bundle — including the cart provider — is loaded there.
 */
const CART_RESET_SCRIPT = `<script>(function(){try{window.localStorage.removeItem('${CART_STORAGE_KEY}');document.cookie='${CART_QUANTITY_COOKIE}=0; Path=/; Max-Age=0; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch(e){}})();</script>`

function isConfirmedOrderMarkup(html: string) {
  return (
    /class=("|')[^"']*\bwoocommerce-order-overview\b/i.test(html) &&
    !/\bwoocommerce-thankyou-order-failed\b/i.test(html)
  )
}

export async function proxyWooRequest(request: Request, path: string[]) {
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) return checkoutUnavailableResponse(request)

  const incomingUrl = new URL(request.url)
  const joinedPath = `/${path.filter(Boolean).join('/')}`
  const isCheckoutPath = path[0] === 'checkout' && isSafePath(path)
  const isStaticAsset = isStaticAssetPath(joinedPath, path)
  const isAdminAjax = joinedPath === '/wp-admin/admin-ajax.php' && isSafePath(path)
  const method = request.method.toUpperCase()

  const allowedMethod =
    (isCheckoutPath && ['GET', 'HEAD', 'POST'].includes(method)) ||
    (isStaticAsset && ['GET', 'HEAD'].includes(method)) ||
    (isAdminAjax && ['GET', 'HEAD', 'POST'].includes(method))
  if (!allowedMethod) return notFoundResponse()
  if (method === 'POST' && !isTrustedWriteOrigin(request)) return notFoundResponse()

  const locale = localeFromRequest(request)
  const targetPath = isCheckoutPath && !joinedPath.endsWith('/') ? `${joinedPath}/` : joinedPath
  const target = new URL(targetPath, cmsOrigin)
  target.search = incomingUrl.search
  if (isCheckoutPath) {
    target.searchParams.delete('locale')
    target.searchParams.set('lang', locale)
  }

  const requestHeaders = new Headers()
  const incomingCookie = filterCheckoutCookies(request.headers.get('cookie') ?? '')
  const forwardedCookie = isCheckoutPath || isAdminAjax
    ? alignPolylangCookie(incomingCookie, locale)
    : ''
  if (forwardedCookie) requestHeaders.set('cookie', forwardedCookie)
  requestHeaders.set('accept', request.headers.get('accept') ?? '*/*')
  requestHeaders.set(
    'accept-language',
    isCheckoutPath ? `${locale},en;q=0.8` : request.headers.get('accept-language') ?? ''
  )
  requestHeaders.set('x-alifleet-frontend-origin', frontendOrigin(request))
  requestHeaders.set('x-alifleet-locale', locale)
  requestHeaders.set('accept-encoding', 'identity')

  const init: RequestInit = { method, headers: requestHeaders, redirect: 'manual' }
  if (method === 'POST') {
    const contentType = request.headers.get('content-type')
    if (contentType) requestHeaders.set('content-type', contentType)
    const requestedWith = request.headers.get('x-requested-with')
    if (requestedWith) requestHeaders.set('x-requested-with', requestedWith)
    try {
      init.body = await readBodyWithLimit(
        request.body,
        request.headers.get('content-length'),
        REQUEST_BODY_LIMIT_BYTES
      )
    } catch (error) {
      if (error instanceof BodyLimitExceededError) return requestTooLargeResponse()
      return checkoutUnavailableResponse(request)
    }
  }

  let upstream: Response
  try {
    upstream = await fetchWooUpstream(target, init)
  } catch {
    return checkoutUnavailableResponse(request)
  }
  const responseHeaders = copyResponseHeaders(upstream.headers, isStaticAsset)
  if (!isStaticAsset) {
    for (const cookie of setCookiesFrom(upstream)) {
      if (!isAllowedSetCookie(cookie)) continue
      const normalized = frontendSetCookie(cookie)
      if (normalized) responseHeaders.append('set-cookie', normalized)
    }
  }

  const location = upstream.headers.get('location')
  if (location && upstream.status >= 300 && upstream.status < 400) {
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

  if (method === 'HEAD') {
    return new Response(null, { status: upstream.status, headers: responseHeaders })
  }

  const contentType = upstream.headers.get('content-type') ?? ''
  let upstreamBody: Uint8Array
  try {
    upstreamBody = await readBodyWithLimit(
      upstream.body,
      upstream.headers.get('content-length'),
      contentType.includes('text/html') ? UPSTREAM_TEXT_LIMIT_BYTES : UPSTREAM_ASSET_LIMIT_BYTES
    )
  } catch (error) {
    if (error instanceof BodyLimitExceededError) return upstreamTooLargeResponse()
    return checkoutUnavailableResponse(request)
  }

  responseHeaders.delete('content-length')
  if (contentType.includes('text/html')) {
    let body = rewriteHtml(decodeUtf8(upstreamBody), request, isCheckoutPath)

    if (isOrderReceivedPath(path) && upstream.ok && isConfirmedOrderMarkup(body)) {
      body = body.replace('</body>', `${CART_RESET_SCRIPT}</body>`)
    }

    return new Response(body, { status: upstream.status, headers: responseHeaders })
  }

  return new Response(upstreamBody, { status: upstream.status, headers: responseHeaders })
}

/**
 * Rewrites WordPress URLs inside a JSON payload, including the `\/`-escaped
 * form `wp_send_json()` produces. WooCommerce returns the order-received URL in
 * the checkout AJAX response, so without this the browser is redirected onto
 * the WordPress origin the moment an order succeeds.
 */
function rewriteJsonUrls(text: string, request: Request) {
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) return text

  const plain = text.replace(
    new RegExp(`${escapeRegExp(cmsOrigin)}([^"'\\s\\\\]*)`, 'g'),
    (_match, suffix: string) => rewriteCmsUrl(`${cmsOrigin}${suffix}`, request)
  )

  const escapedOrigin = cmsOrigin.replace(/\//g, '\\/')
  return plain.replace(
    new RegExp(`${escapeRegExp(escapedOrigin)}((?:\\\\/|[^"'\\s\\\\])*)`, 'g'),
    (_match, suffix: string) => {
      const rewritten = rewriteCmsUrl(`${cmsOrigin}${suffix.replace(/\\\//g, '/')}`, request)
      return rewritten.replace(/\//g, '\\/')
    }
  )
}

/**
 * Proxies WooCommerce's `/?wc-ajax=<action>` endpoints (order review refresh,
 * coupons, and the actual "place order" call) so checkout.js keeps working from
 * the Next.js origin instead of posting cross-site without cookies.
 */
export async function proxyWcAjaxRequest(request: Request) {
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) return checkoutUnavailableResponse(request, true)

  const incomingUrl = new URL(request.url)
  const action = incomingUrl.searchParams.get('wc-ajax') ?? ''
  const method = request.method.toUpperCase()
  if (!ALLOWED_WC_AJAX_ACTIONS.has(action) || !['GET', 'HEAD', 'POST'].includes(method)) {
    return notFoundResponse()
  }
  if (method === 'POST' && !isTrustedWriteOrigin(request)) return notFoundResponse()

  const locale = localeFromRequest(request)
  const target = new URL('/', cmsOrigin)
  for (const [key, value] of incomingUrl.searchParams) {
    if (key !== 'locale' && key !== 'lang') target.searchParams.append(key, value)
  }
  target.searchParams.set('lang', locale)

  const requestHeaders = new Headers()
  const incomingCookie = alignPolylangCookie(
    filterCheckoutCookies(request.headers.get('cookie') ?? ''),
    locale
  )
  if (incomingCookie) requestHeaders.set('cookie', incomingCookie)
  requestHeaders.set('accept', request.headers.get('accept') ?? '*/*')
  requestHeaders.set('accept-language', `${locale},en;q=0.8`)
  requestHeaders.set('x-requested-with', request.headers.get('x-requested-with') ?? 'XMLHttpRequest')
  requestHeaders.set('x-alifleet-frontend-origin', frontendOrigin(request))
  requestHeaders.set('x-alifleet-locale', locale)
  requestHeaders.set('accept-encoding', 'identity')

  const init: RequestInit = { method, headers: requestHeaders, redirect: 'manual' }
  if (method === 'POST') {
    const contentType = request.headers.get('content-type')
    if (contentType) requestHeaders.set('content-type', contentType)
    try {
      init.body = await readBodyWithLimit(
        request.body,
        request.headers.get('content-length'),
        REQUEST_BODY_LIMIT_BYTES
      )
    } catch (error) {
      if (error instanceof BodyLimitExceededError) return requestTooLargeResponse(true)
      return checkoutUnavailableResponse(request, true)
    }
  }

  let upstream: Response
  try {
    upstream = await fetchWooUpstream(target, init)
  } catch {
    return checkoutUnavailableResponse(request, true)
  }
  const responseHeaders = copyResponseHeaders(upstream.headers)
  for (const cookie of setCookiesFrom(upstream)) {
    if (!isAllowedSetCookie(cookie)) continue
    const normalized = frontendSetCookie(cookie)
    if (normalized) responseHeaders.append('set-cookie', normalized)
  }

  const location = upstream.headers.get('location')
  if (location && upstream.status >= 300 && upstream.status < 400) {
    responseHeaders.set('location', rewriteCmsUrl(location, request))
    return new Response(null, { status: upstream.status, headers: responseHeaders })
  }

  if (method === 'HEAD') {
    return new Response(null, { status: upstream.status, headers: responseHeaders })
  }

  let upstreamBody: Uint8Array
  try {
    upstreamBody = await readBodyWithLimit(
      upstream.body,
      upstream.headers.get('content-length'),
      UPSTREAM_TEXT_LIMIT_BYTES
    )
  } catch (error) {
    if (error instanceof BodyLimitExceededError) return upstreamTooLargeResponse(true)
    return checkoutUnavailableResponse(request, true)
  }

  responseHeaders.delete('content-length')
  const contentType = upstream.headers.get('content-type') ?? ''
  if (/json|text\//i.test(contentType)) {
    const rewritten = rewriteAjaxEndpoints(
      stripFrontendOrigins(rewriteJsonUrls(decodeUtf8(upstreamBody), request), frontendOrigin(request))
    )
    return new Response(rewritten, { status: upstream.status, headers: responseHeaders })
  }

  return new Response(upstreamBody, { status: upstream.status, headers: responseHeaders })
}

export async function createWooSessionHandoff(request: Request, authToken: string, locale: Locale) {
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) throw new Error('WordPress checkout is not configured.')

  const response = await fetchWooUpstream(`${cmsOrigin}/wp-json/alifleet/v1/session`, {
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
