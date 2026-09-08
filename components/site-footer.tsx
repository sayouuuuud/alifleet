'use client'

import Image from 'next/image'
import LocaleLink from '@/components/locale-link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useStore } from '@/lib/store-context'

/*
 * Brand marks are drawn inline: lucide dropped its brand icons, and pulling a
 * second icon package in for three glyphs is not worth the bundle.
 */
type IconProps = { className?: string }

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  )
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.98c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07Zm0 3.37a5.13 5.13 0 1 1 0 10.26 5.13 5.13 0 0 1 0-10.26Zm0 8.46a3.33 3.33 0 1 0 0-6.66 3.33 3.33 0 0 0 0 6.66Zm6.54-8.66a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
    </svg>
  )
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.7a5.68 5.68 0 0 0-.77-.05A5.66 5.66 0 1 0 15.54 15V8.9a7.35 7.35 0 0 0 4.3 1.38V7.19a4.29 4.29 0 0 1-3.24-1.37Z" />
    </svg>
  )
}

export function SiteFooter() {
  const { t, locale } = useLanguage()
  const store = useStore()

  const socialLinks = [
    { href: store.social.facebook, label: 'Facebook', icon: FacebookIcon },
    { href: store.social.instagram, label: 'Instagram', icon: InstagramIcon },
    { href: store.social.tiktok, label: 'TikTok', icon: TikTokIcon },
  ].filter((social): social is typeof social & { href: string } =>
    Boolean(social.href)
  )

  const columns = [
    {
      heading: t.footer.fleet,
      links: [
        // These used to carry `?type=` params that nothing ever read. The two
        // anchors are the real filters the page offers.
        { label: t.footer.fleetLinks.trucks, href: '/cars#for-sale' },
        { label: t.footer.fleetLinks.vans, href: '/cars#for-sale' },
        { label: t.footer.fleetLinks.luxury, href: '/cars#import' },
        { label: t.footer.fleetLinks.used, href: '/cars#for-sale' },
      ],
    },
    {
      heading: t.footer.services,
      links: [
        { label: t.footer.servicesLinks.import, href: '/cars#import' },
        { label: t.footer.servicesLinks.parts, href: '/products' },
        { label: t.footer.servicesLinks.consulting, href: '/contact' },
        { label: t.footer.servicesLinks.support, href: '/contact' },
      ],
    },
    {
      heading: t.footer.company,
      links: [
        { label: t.footer.companyLinks.about, href: '/#fleet' },
        { label: t.footer.companyLinks.careers, href: '/contact' },
        { label: t.footer.companyLinks.news, href: '/blog' },
        { label: t.footer.companyLinks.contact, href: '/contact' },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Image
              src="/images/ali-fleet-logo.png"
              alt="ALI FLEET logo"
              width={140}
              height={51}
              className="h-11 w-auto"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
            {/* Contact rows come from WordPress, so each one is only rendered
                once it actually has a value — an empty tel: link is worse than
                no link at all. */}
            <ul className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
              {store.phone && (
                <li>
                  <a
                    href={store.phoneHref}
                    className="flex items-center gap-2.5 transition-colors hover:text-primary"
                  >
                    <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span dir="ltr">{store.phone}</span>
                  </a>
                </li>
              )}
              {store.email && (
                <li>
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-2.5 transition-colors hover:text-primary"
                  >
                    <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span dir="ltr">{store.email}</span>
                  </a>
                </li>
              )}
              {store.addressLines.length > 0 && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{store.addressLines.join(', ')}</span>
                </li>
              )}
            </ul>

            {/*
              Social profiles carry the customer reviews, so they are worth a
              visible place rather than only sitting in the page's structured
              data. Each link is rendered only when the CMS has a URL for it.
            */}
            {socialLinks.length > 0 && (
              <ul className="mt-6 flex items-center gap-3">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                      <social.icon className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <LocaleLink
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {store.name}. {t.footer.rights}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <LocaleLink
              href="/privacy-policy"
              className="transition-colors hover:text-foreground"
            >
              {locale === 'ar' ? 'سياسة الخصوصية' : locale === 'he' ? 'מדיניות הפרטיות' : 'Privacy Policy'}
            </LocaleLink>
            <LocaleLink
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              {locale === 'ar' ? 'الشروط والأحكام' : locale === 'he' ? 'תנאים והגבלות' : 'Terms & Conditions'}
            </LocaleLink>
            <LocaleLink
              href="/return-policy"
              className="transition-colors hover:text-foreground"
            >
              {locale === 'ar' ? 'سياسة الإرجاع والاستبدال' : locale === 'he' ? 'מדיניות החזרה והחלפה' : 'Refund & Returns'}
            </LocaleLink>
          </div>
          <p>{t.footer.slogan}</p>
        </div>
      </div>
    </footer>
  )
}
