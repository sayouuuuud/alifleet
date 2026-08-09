'use client'

import Link from 'next/link'
import { ArrowUpRight, Ship, Store } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { PageHero } from '@/components/page-hero'

/**
 * The hero for /cars. Its job is to make the page's two halves legible at a
 * glance: this site now sells cars off the lot *and* imports them to order, and
 * a visitor arrives wanting exactly one of those. The two CTAs are anchors, not
 * routes, so the choice never costs a page load.
 */
export function CarsHero() {
  const { t } = useLanguage()

  return (
    <PageHero
      eyebrow={t.cars.eyebrow}
      title={t.cars.title}
      titleEm={t.cars.titleEm}
      lead={t.cars.lead}
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="#for-sale"
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Store className="size-4" aria-hidden="true" />
          {t.cars.ctaSale}
          <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
        </Link>
        <Link
          href="#import"
          className="flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Ship className="size-4" aria-hidden="true" />
          {t.cars.ctaImport}
        </Link>
      </div>
    </PageHero>
  )
}
