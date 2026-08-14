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
import './globals.css'
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read the visitor's saved language on the server so the first paint already
  // has the right lang/dir — no flash of the wrong direction.
  const stored = (await cookies()).get(LOCALE_STORAGE_KEY)?.value
  const locale = isLocale(stored) ? stored : defaultLocale
  const meta = localeMeta[locale]

  // Resolve the session and the store settings once per request so the header
  // and footer render correctly on the first paint instead of flickering after
  // hydration. Settings are cached, the session never is.
  const [viewer, storeSettings] = await Promise.all([
    loadViewer(),
    getStoreSettings(),
  ])

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`bg-background ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${cairo.variable} ${notoHebrew.variable}`}
    >
      <body className="antialiased">
        <SiteLoader />
        <MetaPixel />
        <LanguageProvider initialLocale={locale}>
          <StoreProvider settings={storeSettings}>
            <AuthProvider viewer={viewer} backendReady={isWpConfigured()}>
              <CartProvider>{children}</CartProvider>
            </AuthProvider>
          </StoreProvider>
        </LanguageProvider>
        <BackToTop />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
