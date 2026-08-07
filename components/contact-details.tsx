'use client'

import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { whatsappLink } from '@/lib/site-config'
import { useStore } from '@/lib/store-context'

export function ContactDetails() {
  const { t } = useLanguage()
  const store = useStore()

  // Only rows that WordPress actually has a value for are shown, so an
  // unconfigured field disappears instead of rendering an empty card.
  const rows = [
    {
      icon: Phone,
      label: t.contact.phoneLabel,
      value: store.phone,
      href: store.phoneHref,
    },
    {
      icon: MessageCircle,
      label: t.contact.whatsappLabel,
      value: store.phone,
      href: whatsappLink(t.cart.whatsappIntro, store.whatsapp),
      external: true,
    },
    {
      icon: Mail,
      label: t.contact.emailLabel,
      value: store.email,
      href: store.email ? `mailto:${store.email}` : '',
    },
  ].filter((row) => row.value && row.href)

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

      {(store.addressLines.length > 0 || store.hours) && (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          {store.addressLines.length > 0 && (
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.contact.addressLabel}
                </p>
                <address className="mt-1 text-sm font-semibold not-italic leading-relaxed text-foreground">
                  {store.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>
            </div>
          )}

          {store.hours && (
            <div
              className={`flex items-start gap-4 ${
                store.addressLines.length > 0 ? 'mt-5 border-t border-border pt-5' : ''
              }`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.contact.hoursLabel}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{store.hours}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
