'use client'

import Link from 'next/link'
import { ArrowUpRight, Ship, Store } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { resolveCopy } from '@/lib/i18n/copy-block'
import type { CarsPageCopy } from '@/lib/wp/cars-page'
import { PageHero } from '@/components/page-hero'

type Props = {
  /** CMS overrides; omitted entirely when WordPress has nothing to say. */
  copy?: CarsPageCopy['hero']
}

/**
 * The hero for /cars. Its job is to make the page's two halves legible at a
 * glance: this site now sells cars off the lot *and* imports them to order, and
 * a visitor arrives wanting exactly one of those. The two CTAs are anchors, not
 * routes, so the choice never costs a page load.
 *
 * Every string is editable in WordPress but defaults to the shipped dictionary,
 * so an empty CMS field never leaves a gap in the page.
 */
export function CarsHero({ copy }: Props) {
  const { t, locale } = useLanguage()

  return (
    <PageHero
      eyebrow={resolveCopy(copy?.eyebrow, locale, t.cars.eyebrow)}
      title={resolveCopy(copy?.title, locale, t.cars.title)}
      titleEm={resolveCopy(copy?.titleEm, locale, t.cars.titleEm)}
      lead={resolveCopy(copy?.lead, locale, t.cars.lead)}
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="#for-sale"
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Store className="size-4" aria-hidden="true" />
          {resolveCopy(copy?.ctaSale, locale, t.cars.ctaSale)}
          <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
        </Link>
        <Link
          href="#import"
          className="flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Ship className="size-4" aria-hidden="true" />
          {resolveCopy(copy?.ctaImport, locale, t.cars.ctaImport)}
        </Link>
      </div>
    </PageHero>
  )
}
