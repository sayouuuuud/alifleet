import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = url

  if (pathname === '/en' || pathname === '/en/') {
    url.pathname = '/en/home-en/'
    return NextResponse.redirect(url)
  }
  if (pathname === '/ar' || pathname === '/ar/') {
    url.pathname = '/ar/home-ar/'
    return NextResponse.redirect(url)
  }

  const match = pathname.match(/^\/(en|ar)\/(.+)-\1\/?$/)
  if (match) {
    const locale = match[1]
    const slug = match[2]

    if (slug === 'home') {
      req.nextUrl.pathname = `/${locale}`
    } else {
      req.nextUrl.pathname = `/${locale}/${slug}`
    }
  }

  const response = intlMiddleware(req)
  response.headers.set('x-original-pathname', pathname)
  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

export default proxy

