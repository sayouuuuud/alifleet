'use client'

import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { CustomerOrder } from '@/lib/wp/types'
import { OrderCard } from './order-card'

export function OrdersView({ orders }: { orders: CustomerOrder[] }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {t.account.eyebrow}
        </p>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-5xl">
          {t.account.orders.title}{' '}
          <em className="italic text-accent">{t.account.orders.titleEm}</em>
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {t.account.orders.lead}
        </p>
      </header>

      {orders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.databaseId} order={order} detailed />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border md:p-10">
          <Package
            className="mx-auto h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-4 font-serif text-xl tracking-tight text-foreground">
            {t.account.orders.empty}
          </p>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            {t.account.orders.emptyLead}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            {t.cart.browseParts}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}
