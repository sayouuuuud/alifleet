'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, MessageCircle, ShieldCheck, Truck } from 'lucide-react'
import type { Part, PartSummary } from '@/lib/data/parts'
import { useLanguage } from '@/lib/i18n/language-context'
import { resolve } from '@/lib/i18n/localized'
import { formatPrice } from '@/lib/format'
import { whatsappLink } from '@/lib/site-config'
import { useStore } from '@/lib/store-context'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductCard } from '@/components/product-card'

export function ProductDetail({
  part,
  related,
}: {
  part: Part
  /** Resolved on the server so this component never reaches for the catalog. */
  related: PartSummary[]
}) {
  const { t, locale } = useLanguage()
  const store = useStore()
  const [quantity, setQuantity] = useState(1)

  const nameLang = part.untranslated ? 'he' : undefined

  const enquiry = whatsappLink(
    [`${t.productDetail.askAbout}: ${part.name[locale]}`, part.sku]
      .filter(Boolean)
      .join(' · '),
    store.whatsapp
  )

  return (
    <>
      <section className="pt-28 md:pt-36">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" data-flip-rtl />
            {t.common.backToProducts}
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Image */}
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
              <Image
                src={part.image || '/placeholder.svg'}
                alt={part.alt[locale]}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Summary */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                {t.products.categories[part.category]}
              </p>
              <h1
                className="mt-3 text-balance font-serif text-3xl leading-tight text-foreground md:text-5xl"
                lang={nameLang}
              >
                {part.name[locale]}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {part.brand && (
                  <span>
                    {t.common.brandLabel}:{' '}
                    <strong className="font-semibold text-foreground">{part.brand}</strong>
                  </span>
                )}
                {part.sku && (
                  <span>
                    {t.common.sku}:{' '}
                    <strong className="font-mono font-semibold text-foreground" dir="ltr">
                      {part.sku}
                    </strong>
                  </span>
                )}
                <span
                  className={
                    part.inStock
                      ? 'rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent'
                      : 'rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground'
                  }
                >
                  {part.inStock ? t.common.inStock : t.common.outOfStock}
                </span>
              </div>

              {part.description[locale] && (
                <p
                  className="mt-6 text-pretty leading-relaxed text-muted-foreground"
                  lang={nameLang}
                >
                  {part.description[locale]}
                </p>
              )}

              <p className="mt-8 font-serif text-4xl text-foreground" dir="ltr">
                {part.price > 0
                  ? formatPrice(part.price, store.currency)
                  : t.common.onRequest}
              </p>

              {/* Quantity + actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label={`${t.common.quantity} -`}
                    className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <span
                    className="min-w-10 text-center text-base font-semibold text-foreground"
                    aria-live="polite"
                    dir="ltr"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label={`${t.common.quantity} +`}
                    className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <AddToCartButton
                  slug={part.slug}
                  quantity={quantity}
                  disabled={!part.inStock}
                  size="lg"
                />

                {enquiry && (
                  <a
                    href={enquiry}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-full bg-card px-6 py-3.5 text-base font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {t.common.whatsapp}
                  </a>
                )}
              </div>

              <div className="mt-7 flex flex-col gap-2.5 rounded-2xl bg-secondary p-5 text-sm text-muted-foreground">
                <p className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {t.productDetail.fitmentNote}
                </p>
                <p className="flex items-start gap-2.5">
                  <Truck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {t.products.trustShipping}
                  {store.phone ? ` · ${store.phone}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Specs and fitment come from curated ACF metadata that most of the
              imported catalog does not have yet, so each panel only renders
              when it has something to show instead of an empty card. */}
          {(part.specs.length > 0 || part.compatibility.length > 0) && (
            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {part.specs.length > 0 && (
                <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
                  <h2 className="font-serif text-2xl text-foreground">
                    {t.common.specifications}
                  </h2>
                  <dl className="mt-5 flex flex-col">
                    {part.specs.map((spec) => (
                      <div
                        key={spec.label[locale]}
                        className="flex items-start justify-between gap-6 border-b border-border py-3.5 last:border-0"
                      >
                        <dt className="text-sm text-muted-foreground">{spec.label[locale]}</dt>
                        <dd className="text-end text-sm font-semibold text-foreground">
                          {resolve(spec.value, locale)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {part.compatibility.length > 0 && (
                <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
                  <h2 className="font-serif text-2xl text-foreground">
                    {t.common.compatibility}
                  </h2>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {part.compatibility.map((model) => (
                      <li
                        key={model}
                        className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground"
                        dir="ltr"
                      >
                        {model}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-20 pb-24">
              <h2 className="font-serif text-2xl text-foreground md:text-3xl">
                {t.productDetail.related}
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => (
                  <ProductCard key={item.slug} part={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
