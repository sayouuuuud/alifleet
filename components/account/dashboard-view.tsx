'use client'

import Link from 'next/link'
import { ArrowRight, MapPin, Package, UserRound } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { localeMeta } from '@/lib/i18n/config'
import type { Customer, Viewer } from '@/lib/wp/types'
import { OrderCard } from './order-card'

const OPEN_STATUSES = ['pending', 'processing', 'onhold']

export function DashboardView({
  customer,
  viewer,
}: {
  customer: Customer
  viewer: Viewer
}) {
  const { t, locale } = useLanguage()

  const displayName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    customer.displayName ||
    viewer.username

  const memberSince = customer.date
    ? new Date(customer.date).toLocaleDateString(localeMeta[locale].htmlLang, {
        year: 'numeric',
        month: 'long',
      })
    : null

  const openOrders = customer.orders.filter((o) =>
    OPEN_STATUSES.includes(o.status)
  ).length
  const recentOrders = customer.orders.slice(0, 3)

  const quickLinks = [
    {
      href: '/account/orders',
      label: t.account.nav.orders,
      lead: t.account.dashboard.ordersLead,
      Icon: Package,
    },
    {
      href: '/account/profile',
      label: t.account.nav.profile,
      lead: t.account.dashboard.editProfileLead,
      Icon: UserRound,
    },
    {
      href: '/account/addresses',
      label: t.account.nav.addresses,
      lead: t.account.dashboard.addressesLead,
      Icon: MapPin,
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {t.account.eyebrow}
        </p>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-5xl">
          {t.account.dashboard.title}{' '}
          <em className="italic text-accent">{t.account.dashboard.titleEm}</em>
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {t.account.dashboard.greeting}, {displayName}. {t.account.dashboard.lead}
        </p>
      </header>

      <section
        aria-label={t.account.dashboard.detailsTitle}
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.dashboard.totalOrders}
          </p>
          <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
            {customer.orders.length}
          </p>
        </div>
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.dashboard.openOrders}
          </p>
          <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
            {openOrders}
          </p>
        </div>
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.dashboard.memberSince}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {memberSince ?? '—'}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {customer.email}
          </p>
        </div>
      </section>

      <section aria-labelledby="recent-orders-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="recent-orders-heading"
            className="font-serif text-2xl tracking-tight text-foreground"
          >
            {t.account.dashboard.recentOrders}
          </h2>
          {customer.orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 text-sm text-accent underline-offset-4 transition-colors hover:underline"
            >
              {t.account.dashboard.viewAll}
              <ArrowRight
                className="h-4 w-4 rtl:rotate-180"
                aria-hidden="true"
              />
            </Link>
          ) : null}
        </div>

        <div className="mt-5">
          {recentOrders.length > 0 ? (
            <div className="flex flex-col gap-4">
              {recentOrders.map((order) => (
                <OrderCard key={order.databaseId} order={order} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border md:p-10">
              <Package
                className="mx-auto h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-4 font-serif text-xl tracking-tight text-foreground">
                {t.account.dashboard.noOrders}
              </p>
              <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                {t.account.dashboard.noOrdersLead}
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                {t.cart.browseParts}
                <ArrowRight
                  className="h-4 w-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="font-serif text-2xl tracking-tight text-foreground"
        >
          {t.account.dashboard.quickActions}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {quickLinks.map(({ href, label, lead, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-3xl bg-card p-5 ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
              <p className="mt-4 text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                {lead}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
