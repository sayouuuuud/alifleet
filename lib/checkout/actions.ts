'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthToken } from '@/lib/auth/session'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { isWpConfigured, wpStoreOrigin } from '@/lib/wp/config'
import {
  createWooSessionHandoff,
  mergeCookies,
  localeForRequest,
} from './proxy'

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function localeFromForm(formData: FormData, request: Request): Locale {
  const value = readText(formData, 'locale')
  return isLocale(value) ? value : localeForRequest(request)
}

function itemsQuery(formData: FormData) {
  const raw = readText(formData, 'items')
  const items = raw
    .split(',')
    .map((entry) => {
      const [id, quantity] = entry.split(':', 2)
      const wooId = Number(id)
      const qty = Number(quantity)
      return Number.isInteger(wooId) && wooId > 0 && Number.isInteger(qty) && qty > 0
        ? `${wooId}:${qty}`
        : null
    })
    .filter((entry): entry is string => Boolean(entry))

  if (items.length === 0 || items.length > 50) throw new Error('Invalid checkout basket.')
  return items.join(',')
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
  const items = itemsQuery(formData)
  const cmsOrigin = wpStoreOrigin()
  if (!cmsOrigin) redirect('/cart?checkout=unavailable')

  const cookieStore = await cookies()
  const authToken = await getAuthToken()

  // A guest must never inherit a previous customer's WooCommerce session.
  // The Next.js JWT remains untouched; only WooCommerce proxy cookies are cleared.
  if (!authToken) {
    for (const { name } of cookieStore.getAll()) {
      if (
        name === 'woocommerce_cart_hash' ||
        name === 'woocommerce_items_in_cart' ||
        name.startsWith('wp_woocommerce_session_') ||
        name.startsWith('woocommerce_')
      ) {
        cookieStore.delete(name)
      }
    }
  }

  let cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  if (authToken) {
    const handoffCookies = await createWooSessionHandoff(request, authToken, locale)
    cookieHeader = mergeCookies(cookieHeader, handoffCookies)
    for (const cookie of handoffCookies) storeProxyCookie(cookieStore, cookie, request)
  }

  const cartResponse = await fetch(
    `${cmsOrigin}/?alifleet-cart=${encodeURIComponent(items)}&alifleet-locale=${locale}`,
    {
      headers: {
        cookie: cookieHeader,
        accept: 'text/html',
        'accept-language': locale === 'ar' ? 'ar,en;q=0.8' : locale === 'he' ? 'he,en;q=0.8' : 'en',
        'x-alifleet-frontend-origin': new URL(request.url).origin,
        'x-alifleet-locale': locale,
      },
      redirect: 'manual',
    }
  )

  if (!(cartResponse.status >= 300 && cartResponse.status < 400)) {
    redirect('/cart?checkout=unavailable')
  }

  const cartCookies = getSetCookies(cartResponse)
  for (const cookie of cartCookies) storeProxyCookie(cookieStore, cookie, request)

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
  if (!name || !value) return

  cookieStore.set(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(request.url).protocol === 'https:',
    path: '/',
    maxAge: 2 * 24 * 60 * 60,
  })
}
