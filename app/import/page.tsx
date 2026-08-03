import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImportHero } from '@/components/import-hero'
import { ImportSteps } from '@/components/import-steps'
import { ImportBrowser } from '@/components/import-browser'
import { ImportCustomCta } from '@/components/import-custom-cta'

export const metadata: Metadata = {
  title: 'Car Import | ALI FLEET',
  description:
    'Import vehicles from Germany, the UAE, the USA, Japan, Korea and Belgium — sourcing, inspection, shipping and customs handled end to end.',
}

export default function ImportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ImportHero />
        <ImportSteps />
        <ImportBrowser />
        <ImportCustomCta />
      </main>
      <SiteFooter />
    </>
  )
}
