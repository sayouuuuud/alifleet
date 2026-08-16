'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthToken } from '@/lib/auth/session'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { isWpConfigured, wpStoreOrigin } from '@/lib/wp/config'
import {
  createWooSessionHandoff,
  frontendOrigin,
  mergeCookies,
  localeForRequest,
} from './proxy'
import { HANDOFF_QUANTITY_COOKIE, isWooStateCookie } from './gate'

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function localeFromForm(formData: FormData, request: Request): Locale {
  const value = readText(formData, 'locale')
  return isLocale(value) ? value : localeForRequest(request)
}

function itemsQuery(formData: FormData) {
  const raw = readText(formData, 'items')
  const parsed = raw
    .split(',')
    .map((entry) => {
      const [id, quantity] = entry.split(':', 2)
      const wooId = Number(id)
      const qty = Number(quantity)
      return Number.isInteger(wooId) && wooId > 0 && Number.isInteger(qty) && qty > 0
        ? { wooId, qty }
        : null
    })
    .filter((entry): entry is { wooId: number; qty: number } => Boolean(entry))

  if (parsed.length === 0 || parsed.length > 50) throw new Error('Invalid checkout basket.')

  return {
    items: parsed.map(({ wooId, qty }) => `${wooId}:${qty}`).join(','),
    quantity: parsed.reduce((total, { qty }) => total + qty, 0),
  }
}

/**
 * Rebuilds the browser's request so the proxy layer can derive the *public*
 * origin from it. The forwarded headers are copied through deliberately: behind
 * the production reverse proxy `host` is the internal listener, and WordPress
 * would render checkout with a `localhost` form action (QA-02).
 */
async function requestFromAction() {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || requestHeaders.get('host')?.trim()
  if (!host) throw new Error('Missing checkout host.')

  const forwardedProto = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')

  const proxied = new Headers()
  for (const name of ['host', 'x-forwarded-host', 'x-forwarded-proto']) {
    const value = requestHeaders.get(name)
    if (value) proxied.set(name, value)
  }
  return new Request(`${protocol}://${host}/checkout`, { headers: proxied })
}

export async function prepareCheckoutAction(formData: FormData) {
  if (!isWpConfigured()) redirect('/cart?checkout=unavailable')

  const request = await requestFromAction()
  const locale = localeFromForm(formData, request)
  const { items, quantity: handedOffQuantity } = itemsQuery(formData)
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) redirect('/cart?checkout=unavailable')

  const cookieStore = await cookies()
  const authToken = await getAuthToken()

  // A guest must never inherit a previous customer's WooCommerce session.
  // The Next.js JWT remains untouched; only WooCommerce proxy cookies are cleared.
  if (!authToken) {
    for (const { name } of cookieStore.getAll()) {
      if (isWooStateCookie(name)) cookieStore.delete(name)
    }
  }

  let cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  if (authToken) {
    // A failed handoff must not abort checkout: the customer can still order as
    // a guest, and throwing here surfaced as a blank error screen instead (QA-07).
    try {
      const handoffCookies = await createWooSessionHandoff(request, authToken, locale)
      cookieHeader = mergeCookies(cookieHeader, handoffCookies)
      for (const cookie of handoffCookies) storeProxyCookie(cookieStore, cookie, request)
    } catch (error) {
      console.error('[alifleet] checkout session handoff failed', error)
    }
  }

  let cartResponse: Response
  try {
    cartResponse = await fetch(
      `${cmsOrigin}/?alifleet-cart=${encodeURIComponent(items)}&alifleet-locale=${locale}`,
      {
        headers: {
          cookie: cookieHeader,
          accept: 'text/html',
          'accept-language': `${locale},en;q=0.8`,
          'x-alifleet-frontend-origin': frontendOrigin(request),
          'x-alifleet-locale': locale,
        },
        redirect: 'manual',
        cache: 'no-store',
      }
    )
  } catch (error) {
    console.error('[alifleet] cart handoff request failed', error)
    redirect('/cart?checkout=unavailable')
  }

  if (!(cartResponse.status >= 300 && cartResponse.status < 400)) {
    console.error('[alifleet] cart handoff returned', cartResponse.status)
    redirect('/cart?checkout=unavailable')
  }

  // WordPress sends the customer to the cart page when nothing in the basket
  // could actually be purchased. Following that through to /checkout would show
  // an empty checkout form, so honour the destination WooCommerce chose.
  const destination = cartResponse.headers.get('location') ?? ''
  const goesToCart = /\/cart\/?($|[?#])/.test(destination)

  const cartCookies = getSetCookies(cartResponse)
  for (const cookie of cartCookies) storeProxyCookie(cookieStore, cookie, request)

  if (goesToCart) {
    // Nothing purchasable made it into WooCommerce, so no basket was handed
    // off. Drop any earlier marker rather than leaving one that would let a
    // stale WooCommerce session render at /checkout.
    cookieStore.delete(HANDOFF_QUANTITY_COOKIE)
    redirect('/cart?checkout=unavailable')
  }

  // Record what was actually pushed. /checkout compares this with the quantity
  // the browser reports so a basket edited after the handoff cannot be
  // presented as current (QA-10).
  cookieStore.set(HANDOFF_QUANTITY_COOKIE, String(handedOffQuantity), {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(request.url).protocol === 'https:',
    path: '/',
    maxAge: 2 * 60 * 60,
  })

  redirect('/checkout')
}

function getSetCookies(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie()
  const value = response.headers.get('set-cookie')
  return value ? [value] : []
}

function storeProxyCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  raw: string,
  request: Request
) {
  const pair = raw.split(';', 1)[0]
  const separator = pair.indexOf('=')
  if (separator <= 0) return

  const name = pair.slice(0, separator).trim()
  const value = pair.slice(separator + 1).trim()
  if (!name) return

  // WooCommerce clears a cookie by re-sending it empty with an expiry in the
  // past. Copying that blindly with a fixed two-day maxAge resurrected the dead
  // value, so the follow-up request to /checkout presented a stale session,
  // WooCommerce saw an empty basket and redirected back to the cart — the
  // "checkout button does nothing" symptom (QA-01).
  const attributes = raw.split(';').slice(1)
  const expires = attributes
    .map((part) => /^\s*expires\s*=\s*(.+)$/i.exec(part)?.[1])
    .find(Boolean)
  const maxAgeRaw = attributes
    .map((part) => /^\s*max-age\s*=\s*(-?\d+)\s*$/i.exec(part)?.[1])
    .find(Boolean)

  const expiresAt = expires ? Date.parse(expires) : Number.NaN
  const isExpired =
    (maxAgeRaw !== undefined && Number(maxAgeRaw) <= 0) ||
    (!Number.isNaN(expiresAt) && expiresAt <= Date.now())

  if (!value || isExpired) {
    cookieStore.delete(name)
    return
  }

  // `cookieStore.set()` percent-encodes the value it is given. WooCommerce
  // already sends its session as `id%7Cexpiry%7Cexpiring%7Chash`, so passing
  // that string through unchanged produced a doubly-encoded `%257C` cookie.
  // WordPress decoded it once, could not split the session on `|`, treated the
  // basket as empty and bounced /checkout back to /cart — the "Continue to
  // checkout does nothing" report (QA-01). Decode first so the re-encode
  // reproduces exactly what WooCommerce issued.
  let storedValue = value
  try {
    storedValue = decodeURIComponent(value)
  } catch {
    // Malformed escapes mean the value was never encoded; keep it verbatim.
  }

  cookieStore.set(name, storedValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(request.url).protocol === 'https:',
    path: '/',
    maxAge: maxAgeRaw !== undefined ? Number(maxAgeRaw) : 2 * 24 * 60 * 60,
  })
}
