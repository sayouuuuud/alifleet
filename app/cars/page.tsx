import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { pageAlternates } from '@/lib/seo/alternates'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CarsHero } from '@/components/cars-hero'
import { SaleBrowser } from '@/components/sale-browser'
import { ImportSteps } from '@/components/import-steps'
import { ImportBrowser } from '@/components/import-browser'
import { ImportCustomCta } from '@/components/import-custom-cta'
import { getVehicles } from '@/lib/wp/vehicles'
import { getSaleCars } from '@/lib/wp/sale-cars'
import { getCarsPageCopy } from '@/lib/wp/cars-page'

/** Title and description follow the visitor's language (see t.seo). */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  return {
    title: t.seo.carsTitle,
    description: t.seo.carsDescription,
    alternates: pageAlternates('/cars/', locale),
  }
}

/**
 * One page, two businesses.
 *
 * "For sale" comes first because it is the shorter path to a purchase — those
 * cars exist today and can be handed over this week. Import follows, with its
 * four-step explainer, because it is a commissioned service that needs to
 * explain itself before its listings mean anything.
 *
 * Both inventories are fetched in parallel with the page's editable copy: they
 * hit different post types and none blocks the others, so a slow or broken
 * half never delays the page — each browser renders its own status
 * independently, and the copy fetch degrades to the bundled dictionaries.
 */
export default async function CarsPage() {
  const [sale, imports, copy] = await Promise.all([
    getSaleCars(),
    getVehicles(),
    getCarsPageCopy(),
  ])

  return (
    <>
      <SiteHeader />
      <main>
        <CarsHero copy={copy.hero} />
        <SaleBrowser cars={sale.cars} status={sale.status} copy={copy.saleHeader} />
        <ImportSteps />
        <ImportBrowser
          cars={imports.cars}
          status={imports.status}
          copy={copy.importHeader}
        />
        <ImportCustomCta />
      </main>
      <SiteFooter />
    </>
  )
}
