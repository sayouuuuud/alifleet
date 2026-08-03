'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { parts } from '@/lib/data/parts'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatPrice } from '@/lib/format'
import { whatsappLink, wordpressCheckoutUrl } from '@/lib/site-config'

export function CartView() {
  const { t, locale } = useLanguage()
  const { lines, setQuantity, remove, clear, ready } = useCart()

  const rows = lines
    .map((line) => {
      const part = parts.find((item) => item.slug === line.slug)
      return part ? { part, quantity: line.quantity } : null
    })
    .filter((row): row is { part: (typeof parts)[number]; quantity: number } => row !== null)

  const subtotal = rows.reduce((total, row) => total + row.part.price * row.quantity, 0)

  const checkoutHref = wordpressCheckoutUrl(
    rows.map((row) => ({ wooId: row.part.wooId, quantity: row.quantity }))
  )

  const whatsappHref = whatsappLink(
    [
      t.cart.whatsappIntro,
      ...rows.map(
        (row) =>
          `• ${row.part.name[locale]} (${row.part.sku}) × ${row.quantity} — ${formatPrice(
            row.part.price * row.quantity
          )}`
      ),
      `${t.cart.subtotal}: ${formatPrice(subtotal)}`,
    ].join('\n')
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
                  src={part.image || '/placeholder.svg'}
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
                  {part.sku} · {formatPrice(part.price)}
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
                    {formatPrice(part.price * quantity)}
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
                    {formatPrice(part.price * quantity)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t.cart.subtotal}
              </p>
              <p className="font-serif text-3xl text-foreground" dir="ltr">
                {formatPrice(subtotal)}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t.cart.shippingNote}
            </p>

            <a
              href={checkoutHref}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-foreground px-6 py-4 text-base font-semibold text-background transition-opacity hover:opacity-90"
            >
              {t.cart.checkout}
              <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
            </a>
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              {t.cart.checkoutNote}
            </p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-secondary px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t.cart.orderViaWhatsapp}
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
