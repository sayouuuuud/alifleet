import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  Fraunces,
  Cairo,
  Noto_Sans_Hebrew,
} from 'next/font/google'
import { cookies } from 'next/headers'
import '../globals.css'
import { MetaPixel } from '@/components/analytics/meta-pixel'
import { BackToTop } from '@/components/back-to-top'
import { SiteLoader } from '@/components/site-loader'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth/auth-context'
import { StoreProvider } from '@/lib/store-context'
import { loadViewer } from '@/lib/auth/queries'
import { getStoreSettings } from '@/lib/wp/settings'
import { isWpConfigured } from '@/lib/wp/config'
import {
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isLocale,
  localeMeta,
} from '@/lib/i18n/config'
import { LenisProvider } from '@/components/lenis-provider'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
})
const notoHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew'],
  variable: '--font-noto-hebrew',
})

export const metadata: Metadata = {
  title: 'ALI FLEET — Luxurious Commercial Vehicles, Import & Spare Parts',
  description:
    'ALI FLEET delivers luxurious commercial vehicles — new and used — global importing of trucks and luxury vehicles, and genuine spare parts services worldwide.',
  generator: 'v0.app',
  // app/icon.png and app/apple-icon.png are picked up automatically by the
  // file convention; these entries also cover the shortcut/legacy slots.
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#fafafa',
}

import { headers } from 'next/headers'

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  // Read the locale from the URL segment instead of the cookie.
  const { locale: localeParam } = await params
  const locale = isLocale(localeParam) ? localeParam : defaultLocale
  const meta = localeMeta[locale]

  // Resolve the session and the store settings once per request so the header
  // and footer render correctly on the first paint instead of flickering after
  // hydration. Settings are cached, the session never is.
  const [viewer, storeSettings] = await Promise.all([
    loadViewer(),
    getStoreSettings(),
  ])

  // Compute hreflangs
  const headersList = await headers()
  const originalPath = headersList.get('x-original-pathname') || '/'
  
  // Extract base slug to generate all localized links
  let baseSlug = ''
  if (locale === 'he') {
    baseSlug = originalPath === '/' ? 'home' : originalPath.replace(/^\//, '').replace(/\/$/, '')
  } else {
    const match = originalPath.match(new RegExp(`^/${locale}/(.+)-${locale}/?$`))
    if (match) {
      baseSlug = match[1]
    } else {
      baseSlug = originalPath.replace(new RegExp(`^/${locale}/?`), '').replace(/\/$/, '')
      if (baseSlug === '') baseSlug = 'home'
    }
  }

  const host = headersList.get('host') || 'alifleet.com'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  const getUrl = (l: string) => {
    let path = ''
    if (l === 'he' && baseSlug === 'home') path = '/'
    else if (l === 'he') path = `/${baseSlug}/`
    else path = `/${l}/${baseSlug}-${l}/`
    return `${baseUrl}${path}`
  }

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`bg-background ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${cairo.variable} ${notoHebrew.variable}`}
    >
      <head>
        <link rel="alternate" hrefLang="he" href={getUrl('he')} />
        <link rel="alternate" hrefLang="en" href={getUrl('en')} />
        <link rel="alternate" hrefLang="ar" href={getUrl('ar')} />
        <link rel="alternate" hrefLang="x-default" href={getUrl('he')} />
      </head>
      <body className="antialiased">
        <SiteLoader />
        <MetaPixel />
        <LenisProvider>
          <LanguageProvider initialLocale={locale}>
            <StoreProvider settings={storeSettings}>
              <AuthProvider viewer={viewer} backendReady={isWpConfigured()}>
                <CartProvider>{children}</CartProvider>
              </AuthProvider>
            </StoreProvider>
          </LanguageProvider>
        </LenisProvider>
        <BackToTop />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
