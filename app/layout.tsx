import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  Fraunces,
  Cairo,
  Noto_Sans_Hebrew,
} from 'next/font/google'
import './globals.css'
import { MetaPixel } from '@/components/analytics/meta-pixel'
import { BackToTop } from '@/components/back-to-top'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { SiteLoader } from '@/components/site-loader'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth/auth-context'
import { StoreProvider } from '@/lib/store-context'
import { loadViewer } from '@/lib/auth/queries'
import { siteUrl } from '@/lib/seo'
import { serializeJsonLd } from '@/lib/json-ld'
import { getStoreSettings } from '@/lib/wp/settings'
import { isWpConfigured } from '@/lib/wp/config'
import { localeMeta } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { pageAlternates } from '@/lib/seo/alternates'

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

const SITE_NAME = 'ALI FLEET'

/** Site title and description follow the visitor's language (t.seo). */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  const SITE_TITLE = t.seo.siteTitle
  const SITE_DESCRIPTION = t.seo.siteDescription
  return {
    // metadataBase turns every relative image and canonical path below into an
    // absolute URL. Without it Open Graph previews resolve against localhost and
    // social platforms silently drop the image.
    metadataBase: new URL(siteUrl()),
    title: {
      default: SITE_TITLE,
      // Inner pages set only their own name; this keeps the brand in the tab.
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: pageAlternates('/', locale),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: siteUrl(),
      images: [
        {
          url: '/images/fleet-truck.png',
          width: 1024,
          height: 1024,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: ['/images/fleet-truck.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // app/icon.png and app/apple-icon.png are picked up automatically by the
    // file convention; these entries also cover the shortcut/legacy slots.
    icons: {
      icon: '/icon.png',
      shortcut: '/icon.png',
      apple: '/apple-icon.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#fafafa',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The proxy resolves indexed URL locales before the cookie, so the first
  // paint always has the canonical language and direction.
  const locale = await getRequestLocale()
  const meta = localeMeta[locale]
  const t = getDictionary(locale)

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
        {/*
          Organization data for search engines. The contact fields are read from
          WordPress, so updating the phone number in the CMS also updates what
          Google shows — no redeploy needed.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'AutoPartsStore',
              name: t.seo.orgName,
              alternateName: t.seo.orgAlternateName,
              inLanguage: locale,
              description: t.seo.siteDescription,
              url: siteUrl(),
              image: `${siteUrl()}/images/fleet-truck.png`,
              telephone: storeSettings.phone || undefined,
              email: storeSettings.email || undefined,
              openingHours: storeSettings.hours || undefined,
              address: storeSettings.addressLines.length
                ? {
                    '@type': 'PostalAddress',
                    streetAddress: storeSettings.addressLines[0],
                    addressLocality: storeSettings.addressLines[1],
                    addressCountry: 'IL',
                  }
                : undefined,
              sameAs: [
                storeSettings.social.instagram,
                storeSettings.social.facebook,
                storeSettings.social.linkedin,
                storeSettings.social.tiktok,
              ].filter(Boolean),
              areaServed: { '@type': 'Country', name: t.seo.areaServed },
              knowsLanguage: ['he', 'ar', 'en'],
              priceRange: '₪₪',
              contactPoint: storeSettings.whatsapp
                ? [
                    {
                      '@type': 'ContactPoint',
                      contactType: 'sales',
                      telephone: `+${storeSettings.whatsapp}`,
                      url: `https://wa.me/${storeSettings.whatsapp}`,
                      availableLanguage: ['he', 'ar', 'en'],
                    },
                  ]
                : undefined,
              // Open every day except Friday.
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
                  opens: '09:00',
                  closes: '18:00',
                },
              ],
            }),
          }}
        />
        <SiteLoader />
        <MetaPixel />
        <LanguageProvider initialLocale={locale}>
          <StoreProvider settings={storeSettings}>
            <AuthProvider viewer={viewer} backendReady={isWpConfigured()}>
              <CartProvider>{children}</CartProvider>
              {/* Needs the store (number) and language (label) providers above. */}
              <WhatsAppButton />
            </AuthProvider>
          </StoreProvider>
        </LanguageProvider>
        <BackToTop />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
