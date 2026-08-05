'use client'

import Link from 'next/link'
import { MessageCircle, Phone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { siteConfig, whatsappLink } from '@/lib/site-config'
import { BackendNotice } from './alerts'

type AuthKey = 'login' | 'register' | 'forgot'

/**
 * Wraps the three public auth screens: renders the localized hero and either the
 * form or, when the WordPress backend is not wired up, a clear setup notice plus
 * direct contact options so the page is never a dead end.
 */
export function AuthShell({
  screen,
  configured,
  children,
}: {
  screen: AuthKey
  configured: boolean
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  const copy = t.account[screen]

  return (
    <section className="pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {t.account.eyebrow}
        </p>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-5xl">
          {copy.title} <em className="italic text-accent">{copy.titleEm}</em>
        </h1>
        <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
          {copy.lead}
        </p>

        <div className="mt-10">
          {configured ? (
            children
          ) : (
            <div className="flex flex-col gap-5">
              <BackendNotice
                title={t.account.backend.title}
                lead={t.account.backend.lead}
                checklist={t.account.backend.checklist}
                steps={[
                  t.account.backend.step1,
                  t.account.backend.step2,
                  t.account.backend.step3,
                ]}
              />

              <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.account.backend.contactLead}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={whatsappLink(t.account.backend.contactLead)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t.common.whatsapp}
                  </a>
                  <a
                    href={`tel:${siteConfig.phone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {t.common.callUs}
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
                  >
                    {t.nav.contact}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
