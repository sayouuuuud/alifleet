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
import { LanguageProvider } from '@/lib/i18n/language-context'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth/auth-context'
import { loadViewer } from '@/lib/auth/queries'
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

  // Resolve the session once per request so the header renders the correct
  // signed-in state on the first paint instead of flickering after hydration.
  const viewer = await loadViewer()

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`bg-background ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${cairo.variable} ${notoHebrew.variable}`}
    >
      <body className="antialiased">
        <LanguageProvider initialLocale={locale}>
          <AuthProvider viewer={viewer} backendReady={isWpConfigured()}>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
