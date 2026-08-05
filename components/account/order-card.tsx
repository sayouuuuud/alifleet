'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { localeMeta } from '@/lib/i18n/config'
import type { CustomerOrder, OrderStatus } from '@/lib/wp/types'

/** Muted, on-brand status tints — no new palette colours introduced. */
const STATUS_TINT: Record<OrderStatus, string> = {
  completed: 'bg-accent/15 text-accent ring-accent/30',
  processing: 'bg-accent/10 text-accent ring-accent/25',
  pending: 'bg-secondary text-secondary-foreground ring-border',
  onhold: 'bg-secondary text-secondary-foreground ring-border',
  checkoutdraft: 'bg-secondary text-muted-foreground ring-border',
  cancelled: 'bg-destructive/10 text-destructive ring-destructive/30',
  refunded: 'bg-destructive/10 text-destructive ring-destructive/30',
  failed: 'bg-destructive/10 text-destructive ring-destructive/30',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage()
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_TINT[status]}`}
    >
      {t.account.orders.statuses[status]}
    </span>
  )
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * WooCommerce returns pre-formatted, currency-aware HTML-ish price strings.
 * Stripping tags is safer than re-deriving the currency on the client.
 */
function cleanPrice(value: string) {
  return value.replace(/<[^>]*>/g, '').trim() || '—'
}

export function OrderCard({
  order,
  detailed = false,
}: {
  order: CustomerOrder
  detailed?: boolean
}) {
  const { t, locale } = useLanguage()
  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0)
  const dateLocale = localeMeta[locale].htmlLang

  return (
    <article className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.orders.number}
          </p>
          <p className="mt-1 font-serif text-xl tracking-tight text-foreground">
            #{order.orderNumber}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.orders.date}
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatDate(order.date, dateLocale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.orders.itemsCount}
          </dt>
          <dd className="mt-1 text-sm text-foreground">{itemCount}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t.account.orders.total}
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {cleanPrice(order.total)}
          </dd>
        </div>
      </dl>

      {detailed && order.lines.length > 0 ? (
        <div className="mt-5 border-t border-border pt-5">
          <ul className="flex flex-col gap-3">
            {order.lines.map((line, index) => (
              <li
                key={`${line.slug ?? line.name}-${index}`}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="min-w-0 text-foreground">
                  <span className="text-muted-foreground">
                    {line.quantity}&times;
                  </span>{' '}
                  {line.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {cleanPrice(line.total)}
                </span>
              </li>
            ))}
          </ul>

          {order.paymentMethodTitle ? (
            <p className="mt-5 text-xs text-muted-foreground">
              {t.account.orders.payment}: {order.paymentMethodTitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
