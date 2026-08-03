'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Part } from '@/lib/data/parts'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatPrice } from '@/lib/format'
import { AddToCartButton } from '@/components/add-to-cart-button'

export function ProductCard({ part }: { part: Part }) {
  const { t, locale } = useLanguage()

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-shadow hover:shadow-xl hover:shadow-foreground/5">
      <Link
        href={`/products/${part.slug}`}
        className="relative block aspect-4/3 overflow-hidden bg-secondary"
      >
        <Image
          src={part.image || '/placeholder.svg'}
          alt={part.alt[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={
            part.inStock
              ? 'absolute start-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground'
              : 'absolute start-3 top-3 rounded-full bg-foreground/80 px-3 py-1 text-[11px] font-semibold text-background'
          }
        >
          {part.inStock ? t.common.inStock : t.common.outOfStock}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {part.brand} · {t.products.categories[part.category]}
        </p>
        <h3 className="mt-2 text-pretty text-base font-semibold leading-snug text-foreground">
          <Link href={`/products/${part.slug}`} className="hover:text-accent">
            {part.name[locale]}
          </Link>
        </h3>
        <p className="mt-1.5 font-mono text-xs text-muted-foreground" dir="ltr">
          {part.sku}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="font-serif text-2xl text-foreground" dir="ltr">
            {formatPrice(part.price)}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/products/${part.slug}`}
              aria-label={`${t.common.viewDetails}: ${part.name[locale]}`}
              className="flex size-9 items-center justify-center rounded-full ring-1 ring-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
            </Link>
            <AddToCartButton slug={part.slug} size="sm" disabled={!part.inStock} />
          </div>
        </div>
      </div>
    </article>
  )
}
