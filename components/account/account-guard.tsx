'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { AuthErrorCode } from '@/lib/wp/errors'
import { BackendNotice, FormError } from './alerts'

/**
 * Renders the translated explanation for a protected page that could not load.
 * `not_configured` gets the full setup checklist; everything else gets a short
 * message plus a route back to sign-in.
 */
export function AccountGuard({ code }: { code: AuthErrorCode }) {
  const { t } = useLanguage()

  if (code === 'not_configured') {
    return (
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
    )
  }

  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
      <h2 className="font-serif text-xl tracking-tight text-foreground">
        {t.account.guard.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t.account.guard.lead}
      </p>
      <div className="mt-5">
        <FormError>
          {t.account.errors[code as keyof typeof t.account.errors] ??
            t.account.errors.unknown}
        </FormError>
      </div>
      <Link
        href="/account/login"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        {t.account.signIn}
        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Link>
    </div>
  )
}
