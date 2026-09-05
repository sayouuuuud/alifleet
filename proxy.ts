import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, LOCALE_STORAGE_KEY, isLocale } from './lib/i18n/config'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Exclude static files, API routes, and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/wc-ajax') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/cms') ||
    pathname.match(/\.(.*)$/) // matches files like .ico, .png, etc.
  ) {
    return NextResponse.next()
  }

  // Check if the pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // If no locale prefix, get the preferred locale from the cookie or use default
  const cookieLocale = request.cookies.get(LOCALE_STORAGE_KEY)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  // Redirect to the locale-prefixed URL
  const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}${search}`, request.url)
  return NextResponse.redirect(newUrl)
}

export const config = {
  // Matcher for middleware to ignore static files and API routes early
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}

export default proxy
export { proxy as middleware }

