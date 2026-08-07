'use client'

import type { PartSummary } from '@/lib/data/parts'
import { useLanguage } from '@/lib/i18n/language-context'
import { PageHero } from '@/components/page-hero'
import { CartView } from '@/components/cart-view'

/**
 * Client shell for the cart page. The catalog arrives from the server so the
 * hero copy can stay localized here while prices and WooCommerce product ids
 * come from a fresh read rather than whatever the browser cached.
 */
export function CartScreen({ catalog }: { catalog: PartSummary[] }) {
  const { t } = useLanguage()

  return (
    <>
      <PageHero eyebrow={t.nav.cart} title={t.cart.title} lead={t.cart.lead} />
      <CartView catalog={catalog} />
    </>
  )
}
