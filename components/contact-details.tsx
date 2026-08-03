'use client'

import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { siteConfig, whatsappLink } from '@/lib/site-config'

export function ContactDetails() {
  const { t } = useLanguage()

  const rows = [
    {
      icon: Phone,
      label: t.contact.phoneLabel,
      value: siteConfig.phone,
      href: siteConfig.phoneHref,
    },
    {
      icon: MessageCircle,
      label: t.contact.whatsappLabel,
      value: siteConfig.phone,
      href: whatsappLink(t.cart.whatsappIntro),
      external: true,
    },
    {
      icon: Mail,
      label: t.contact.emailLabel,
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.label}>
            <a
              href={row.href}
              {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex items-center gap-4 rounded-3xl bg-card p-5 ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent">
                <row.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {row.label}
                </span>
                <span
                  className="block truncate text-sm font-semibold text-foreground"
                  dir="ltr"
                >
                  {row.value}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.contact.addressLabel}
            </p>
            <address className="mt-1 text-sm font-semibold not-italic leading-relaxed text-foreground">
              {siteConfig.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-4 border-t border-border pt-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent">
            <Clock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.contact.hoursLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{siteConfig.hours}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
