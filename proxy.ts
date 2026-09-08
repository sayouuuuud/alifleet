import { NextRequest, NextResponse } from 'next/server'
import {
  LOCALE_HEADER,
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isLocale,
  type Locale,
} from '@/lib/i18n/config'
import {
  localePrefixedPrivatePathname,
  resolvePublicPathname,
} from '@/lib/i18n/routing'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function withLocaleCookie(
  response: NextResponse,
  request: NextRequest,
  locale: Locale
) {
  if (request.cookies.get(LOCALE_STORAGE_KEY)?.value !== locale) {
    response.cookies.set(LOCALE_STORAGE_KEY, locale, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })
  }
  return response
}

function requestHeaders(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers)
  headers.set(LOCALE_HEADER, locale)
  return headers
}

function localeRedirect(
  request: NextRequest,
  pathname: string,
  locale: Locale,
  removeLocaleQuery = true
) {
  const current = request.nextUrl.clone()
  if (removeLocaleQuery) current.searchParams.delete('locale')
  // NextURL normalises a trailing slash away when it formats a pathname, so
  // the canonical `/products/` came out as `/products`: every request without
  // the slash was redirected to itself, forever. Build the Location by hand so
  // the canonical form survives; `/products/` then matches and is served.
  const location = `${current.origin}${pathname}${current.search}${current.hash}`
  return withLocaleCookie(
    NextResponse.redirect(location, { status: 308 }),
    request,
    locale
  )
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const requestedLocale = searchParams.get('locale')
  const publicRoute = resolvePublicPathname(pathname, requestedLocale)

  if (publicRoute) {
    const mustRedirect =
      pathname !== publicRoute.canonicalPathname || isLocale(requestedLocale)

    if (mustRedirect) {
      return localeRedirect(
        request,
        publicRoute.canonicalPathname,
        publicRoute.locale
      )
    }

    const headers = requestHeaders(request, publicRoute.locale)
    const response =
      publicRoute.internalPathname === pathname
        ? NextResponse.next({ request: { headers } })
        : NextResponse.rewrite(
            new URL(
              `${publicRoute.internalPathname}${request.nextUrl.search}`,
              request.url
            ),
            { request: { headers } }
          )

    return withLocaleCookie(response, request, publicRoute.locale)
  }

  const prefixedPrivate = localePrefixedPrivatePathname(pathname)
  if (prefixedPrivate) {
    return localeRedirect(
      request,
      prefixedPrivate.pathname,
      prefixedPrivate.locale
    )
  }

  const cookieLocale = request.cookies.get(LOCALE_STORAGE_KEY)?.value
  const locale = isLocale(requestedLocale)
    ? requestedLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : defaultLocale

  if (isLocale(requestedLocale)) {
    return localeRedirect(request, pathname, locale)
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders(request, locale) },
  })
  return withLocaleCookie(response, request, locale)
}

export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next(?:/|$)|favicon.ico$|icon.png$|apple-icon.png$|robots.txt$|sitemap.xml$|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}
