import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartScreen } from '@/components/cart-screen'
import { getCatalog } from '@/lib/wp/catalog'

/** Title and description follow the visitor's language (see t.seo). */
export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getRequestLocale())
  return {
    title: t.seo.cartTitle,
    description: t.seo.cartDescription,
    alternates: { canonical: '/cart' },
  }
}

export default async function CartPage() {
  // The browser only persists slugs and quantities. Resolving them against a
  // live catalog here means the totals and the ids sent to WooCommerce checkout
  // always reflect the current store, not a stale snapshot.
  const { parts } = await getCatalog()

  return (
    <>
      <SiteHeader />
      <main>
        <CartScreen catalog={parts} />
      </main>
      <SiteFooter />
    </>
  )
}
