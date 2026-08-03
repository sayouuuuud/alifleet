'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { PageHero } from '@/components/page-hero'

export function ImportHero() {
  const { t } = useLanguage()

  return (
    <PageHero
      eyebrow={t.import.eyebrow}
      title={t.import.title}
      titleEm={t.import.titleEm}
      lead={t.import.lead}
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="#available"
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {t.import.ctaBrowse}
          <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
        </Link>
        <Link
          href="/contact?subject=import"
          className="rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
        >
          {t.import.ctaCustom}
        </Link>
      </div>
    </PageHero>
  )
}
