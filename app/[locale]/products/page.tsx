import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductsScreen } from '@/components/products-screen'
import { getCatalogSummaries } from '@/lib/wp/catalog'

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
