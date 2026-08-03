'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { ProductsBrowser } from '@/components/products-browser'
import { useLanguage } from '@/lib/i18n/language-context'

export default function ProductsPage() {
  const { t } = useLanguage()

  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={t.products.eyebrow}
          title={t.products.title}
          titleEm={t.products.titleEm}
          lead={t.products.lead}
        />
        <ProductsBrowser />
      </main>
      <SiteFooter />
    </>
  )
}
