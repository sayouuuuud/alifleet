import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartScreen } from '@/components/cart-screen'
import { getCatalog } from '@/lib/wp/catalog'

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
