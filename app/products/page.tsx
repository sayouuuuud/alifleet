import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { pageAlternates } from '@/lib/seo/alternates'
import { getRequestLocale } from '@/lib/i18n/request-locale'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductsScreen } from '@/components/products-screen'
import { getCatalogSummaries } from '@/lib/wp/catalog'

/** Title and description follow the visitor's language (see t.seo). */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  const alternates = pageAlternates('/products/', locale)
  return {
    title: t.seo.productsTitle,
    description: t.seo.productsDescription,
    alternates,
    openGraph: { type: 'website', title: t.seo.productsTitle, description: t.seo.productsDescription, url: alternates.canonical },
  }
}

/**
 * The catalog is read on the server so the products are in the initial HTML —
 * good for SEO and it keeps the WooCommerce endpoint out of the browser. The
 * fetch is cached, so 165 products do not mean 165 round trips per visitor.
 */
export default async function ProductsPage() {
  const { parts, status, hasUntranslated } = await getCatalogSummaries()

  return (
    <>
      <SiteHeader />
      <main>
        <ProductsScreen
          parts={parts}
          status={status}
          hasUntranslated={hasUntranslated}
        />
      </main>
      <SiteFooter />
    </>
  )
}
