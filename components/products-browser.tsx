'use client'

import { useMemo, useState } from 'react'
import { Search, ShieldCheck, Truck, BadgeCheck, X } from 'lucide-react'
import { parts, partCategories, type PartCategory } from '@/lib/data/parts'
import { useLanguage } from '@/lib/i18n/language-context'
import { ProductCard } from '@/components/product-card'

type SortKey = 'featured' | 'priceAsc' | 'priceDesc' | 'nameAsc'

export function ProductsBrowser() {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PartCategory | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('featured')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = parts.filter((part) => {
      if (category !== 'all' && part.category !== category) return false
      if (!needle) return true
      const haystack = [
        part.name[locale],
        part.brand,
        part.sku,
        ...part.compatibility,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })

    const sorted = [...filtered]
    if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price)
    else if (sort === 'priceDesc') sorted.sort((a, b) => b.price - a.price)
    else if (sort === 'nameAsc')
      sorted.sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale))
    else
      sorted.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
      )
    return sorted
  }, [query, category, sort, locale])

  const hasFilters = query.trim() !== '' || category !== 'all'

  const trust = [
    { icon: ShieldCheck, label: t.products.trustWarranty },
    { icon: Truck, label: t.products.trustShipping },
    { icon: BadgeCheck, label: t.products.trustGenuine },
  ]

  return (
    <>
      {/* Trust strip */}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {trust.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <item.icon className="size-4 text-accent" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <section className="mx-auto mt-10 max-w-7xl px-4 pb-24 md:px-8">
        {/* Controls */}
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border md:flex-row md:items-center md:p-5">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute inset-y-0 start-4 my-auto size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.products.searchPlaceholder}
              aria-label={t.common.search}
              className="w-full rounded-full bg-secondary py-3 pe-4 ps-11 text-sm text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-accent"
            />
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="sort"
              className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              {t.common.sortBy}
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-full bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-accent"
            >
              <option value="featured">{t.common.featured}</option>
              <option value="priceAsc">{t.common.priceAsc}</option>
              <option value="priceDesc">{t.common.priceDesc}</option>
              <option value="nameAsc">{t.common.nameAsc}</option>
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="sr-only">{t.products.categoriesLabel}</span>
          <button
            type="button"
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
            className={
              category === 'all'
                ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
                : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground'
            }
          >
            {t.common.all}
          </button>
          {partCategories.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              aria-pressed={category === key}
              className={
                category === key
                  ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
                  : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground'
              }
            >
              {t.products.categories[key]}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span dir="ltr">{visible.length}</span> {t.common.resultsCount}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <X className="size-3.5" aria-hidden="true" />
              {t.common.clearFilters}
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
            <p className="text-base text-muted-foreground">{t.common.noResults}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((part) => (
              <ProductCard key={part.slug} part={part} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
