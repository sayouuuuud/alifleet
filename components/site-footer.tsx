'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useStore } from '@/lib/store-context'

export function SiteFooter() {
  const { t } = useLanguage()
  const store = useStore()

  const columns = [
    {
      heading: t.footer.fleet,
      links: [
        { label: t.footer.fleetLinks.trucks, href: '/import?type=truck' },
        { label: t.footer.fleetLinks.vans, href: '/import?type=van' },
        { label: t.footer.fleetLinks.luxury, href: '/import?type=luxury' },
        { label: t.footer.fleetLinks.used, href: '/import' },
      ],
    },
    {
      heading: t.footer.services,
      links: [
        { label: t.footer.servicesLinks.import, href: '/import' },
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
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {t.footer.rights}
          </p>
          <p>{t.footer.slogan}</p>
        </div>
      </div>
    </footer>
  )
}
