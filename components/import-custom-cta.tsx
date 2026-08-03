'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'

export function ImportCustomCta() {
  const { t } = useLanguage()

  return (
    <section className="border-t border-border bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
        <div className="max-w-xl">
          <h2 className="text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">
            {t.import.customTitle}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-background/70">
            {t.import.customLead}
          </p>
        </div>
        <Link
          href="/contact?subject=import"
          className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t.import.customCta}
          <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
        </Link>
      </div>
    </section>
  )
}
