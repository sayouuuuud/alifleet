'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import type { PartSummary } from '@/lib/data/parts'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatPrice } from '@/lib/format'
import { proxied } from '@/lib/img-proxy'
import { whatsappLink } from '@/lib/site-config'
import { prepareCheckoutAction } from '@/lib/checkout/actions'
import { useStore } from '@/lib/store-context'

/**
 * The cart itself only ever stores slugs and quantities in localStorage, so the
 * catalog is passed in from the server page to resolve them into live products.
 * That means prices, stock and — critically — WooCommerce product ids are read
 * fresh instead of trusting whatever was cached in the browser.
 */
/**
 * Split into its own component because `useFormStatus` only reports the status
 * of the form it is rendered inside. Without a pending state the button stayed
 * clickable and silent while the server action rebuilt the WooCommerce basket,
 * which read as "nothing happened" (QA-06).
 */
function CheckoutSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-foreground px-6 py-4 text-base font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
        </>
      )}
    </button>
  )
}

export function CartView({ catalog }: { catalog: PartSummary[] }) {
  const { t, locale } = useLanguage()
  const searchParams = useSearchParams()
  // The server action redirects back here with this flag when WooCommerce could
  // not be handed the basket, so the failure is visible instead of silent.
  const checkoutFailed = searchParams.get('checkout') === 'unavailable'
  const store = useStore()
  const { lines, setQuantity, remove, clear, ready } = useCart()

  const rows = lines
    .map((line) => {
      const part = catalog.find((item) => item.slug === line.slug)
      return part ? { part, quantity: line.quantity } : null
    })
    .filter((row): row is { part: PartSummary; quantity: number } => row !== null)

  const subtotal = rows.reduce((total, row) => total + row.part.price * row.quantity, 0)

  const checkoutItems = rows
    .map((row) => `${row.part.wooId}:${row.quantity}`)
    .join(',')
  const checkoutReady = Boolean(store.wordpress.baseUrl)

  const whatsappHref = whatsappLink(
    [
      t.cart.whatsappIntro,
      ...rows.map(
        (row) =>
          `• ${row.part.name[locale]} (${row.part.sku}) × ${row.quantity} — ${formatPrice(
            row.part.price * row.quantity,
            store.currency
          )}`
      ),
      `${t.cart.subtotal}: ${formatPrice(subtotal, store.currency)}`,
    ].join('\n'),
    store.whatsapp
  )

  // Avoid rendering an "empty cart" flash before localStorage is read.
  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="flex flex-col items-center rounded-3xl bg-card p-12 text-center ring-1 ring-border md:p-20">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
            <ShoppingCart className="size-7 text-muted-foreground" aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">
            {t.cart.empty}
          </h2>
          <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            {t.cart.emptyLead}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-base font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.cart.browseParts}
            <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-10">
        {/* Lines */}
        <ul className="flex flex-col gap-4">
          {rows.map(({ part, quantity }) => (
            <li
              key={part.slug}
              className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border sm:flex-row sm:items-center md:p-5"
            >
              <Link
                href={`/products/${part.slug}`}
                className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl bg-secondary sm:size-28 sm:aspect-auto"
              >
                <Image
                  src={proxied(part.image)}
                  alt={part.alt[locale]}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {part.brand} · {t.products.categories[part.category]}
                </p>
                <h3 className="mt-1.5 text-pretty text-base font-semibold leading-snug text-foreground">
                  <Link href={`/products/${part.slug}`} className="hover:text-accent">
                    {part.name[locale]}
                  </Link>
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">
                  {part.sku} · {formatPrice(part.price, store.currency)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(part.slug, quantity - 1)}
                    aria-label={`${t.common.quantity} -`}
                    className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <span
                    className="min-w-8 text-center text-sm font-semibold text-foreground"
                    dir="ltr"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(part.slug, quantity + 1)}
                    aria-label={`${t.common.quantity} +`}
                    className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-serif text-xl text-foreground" dir="ltr">
                    {formatPrice(part.price * quantity, store.currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(part.slug)}
                    aria-label={`${t.common.remove}: ${part.name[locale]}`}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}

          <li className="flex justify-between gap-4 px-1">
            <Link
              href="/products"
              className="text-sm font-medium text-accent hover:underline"
            >
              {t.cart.continueShopping}
            </Link>
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              {t.cart.clearCart}
            </button>
          </li>
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-7">
            <h2 className="font-serif text-2xl text-foreground">{t.cart.summary}</h2>

            <dl className="mt-6 flex flex-col gap-3 border-b border-border pb-6">
              {rows.map(({ part, quantity }) => (
                <div key={part.slug} className="flex justify-between gap-4 text-sm">
                  <dt className="min-w-0 truncate text-muted-foreground">
                    {part.name[locale]} × <span dir="ltr">{quantity}</span>
                  </dt>
                  <dd className="shrink-0 font-medium text-foreground" dir="ltr">
                    {formatPrice(part.price * quantity, store.currency)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t.cart.subtotal}
              </p>
              <p className="font-serif text-3xl text-foreground" dir="ltr">
                {formatPrice(subtotal, store.currency)}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t.cart.shippingNote}
            </p>

            {/* The server action rebuilds the WooCommerce basket, hands off the
                authenticated customer session, then redirects to /checkout on
                this same Next.js origin. */}
            {checkoutFailed && (
              <p
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-4 text-sm leading-relaxed text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t.cart.checkoutUnavailable}
              </p>
            )}

            {checkoutReady && (
              <>
                <form action={prepareCheckoutAction}>
                  <input type="hidden" name="items" value={checkoutItems} />
                  <input type="hidden" name="locale" value={locale} />
                  <CheckoutSubmit
                    label={t.cart.checkout}
                    pendingLabel={t.cart.checkoutPending}
                  />
                </form>
                <p className="mt-2.5 text-center text-xs text-muted-foreground">
                  {t.cart.checkoutNote}
                </p>
              </>
            )}

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-secondary px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t.cart.orderViaWhatsapp}
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
