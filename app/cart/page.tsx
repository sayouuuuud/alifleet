'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { CartView } from '@/components/cart-view'
import { useLanguage } from '@/lib/i18n/language-context'

export default function CartPage() {
  const { t } = useLanguage()

  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={t.nav.cart}
          title={t.cart.title}
          lead={t.cart.lead}
        />
        <CartView />
      </main>
      <SiteFooter />
    </>
  )
}
