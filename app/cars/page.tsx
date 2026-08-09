import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Cars | ALI FLEET',
  description:
    'Cars for sale from our own yard, plus vehicle import from Germany, the UAE, the USA, Japan, Korea and Belgium — sourcing, inspection, shipping and customs handled end to end.',
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
