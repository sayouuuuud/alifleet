'use client'

import { useMemo, useState } from 'react'
import { Search, ShieldCheck, Truck, BadgeCheck, X } from 'lucide-react'
import { Paginator } from '@/components/paginator'
import { partCategories, type PartCategory, type PartSummary } from '@/lib/data/parts'
import { buildHaystack, matchesQuery } from '@/lib/search/match'
import { useLanguage } from '@/lib/i18n/language-context'
import { ProductCard } from '@/components/product-card'

type SortKey = 'featured' | 'priceAsc' | 'priceDesc' | 'nameAsc'

export function ProductsBrowser({ parts }: { parts: PartSummary[] }) {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PartCategory | 'all'>('all')
  const [brand, setBrand] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('featured')
  const [page, setPage] = useState(1)
  // Six rows of four at the widest breakpoint: the owner wants the catalogue
  // to feel full rather than paginated after eight items.
  const PAGE_SIZE = 24

  // Only categories that actually contain products get a chip, so the imported
  // catalog does not show seven dead filters next to one live one.
  // Truck brands present in the catalogue (DAF, MAN, Volvo…), for the brand filter.
  const availableBrands = useMemo(
    () => Array.from(new Set(parts.map((part) => part.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [parts]
  )

  const availableCategories = useMemo(() => {
    const present = new Set(parts.map((part) => part.category))
    return partCategories.filter((key) => present.has(key))
  }, [parts])

  // One word list per product, built once: names in all three languages,
  // brand and SKU. matchesQuery() handles word order, prefixes and synonyms.
  const haystacks = useMemo(
    () =>
      new Map(
        parts.map((part) => [
          part,
          buildHaystack([part.name.ar, part.name.he, part.name.en, part.brand, part.sku, part.searchTerms]),
        ])
      ),
    [parts]
  )

  const visible = useMemo(() => {
    const needle = query.trim()
    const filtered = parts.filter((part) => {
      if (category !== 'all' && part.category !== category) return false
      if (brand !== 'all' && part.brand !== brand) return false
      if (!needle) return true
      // Every locale is searched, not just the active one: a customer who knows
      // the Hebrew name of a part must still find it while browsing in Arabic.
      return matchesQuery(haystacks.get(part) ?? [], needle, part.searchHashes)
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
  }, [parts, haystacks, query, category, brand, sort, locale])

  // Reset to page 1 whenever the filtered set changes
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasFilters = query.trim() !== '' || category !== 'all' || brand !== 'all'

  const trust = [
    { icon: ShieldCheck, label: t.products.trustWarranty },
    { icon: Truck, label: t.products.trustShipping },
    { icon: BadgeCheck, label: t.products.trustFitment },
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
              placeholder={t.products.searchPlaceholder}
              aria-label={t.common.search}
              onChange={(event) => { setQuery(event.target.value); setPage(1) }}
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

        {/* Brand chips: customers look for parts by their truck first */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.productsFilters.brandsLabel}
          </span>
          <button
            type="button"
            onClick={() => { setBrand('all'); setPage(1) }}
            aria-pressed={brand === 'all'}
            className={
              brand === 'all'
                ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
                : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground'
            }
          >
            {t.productsFilters.allBrands}
          </button>
          {availableBrands.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setBrand(key); setPage(1) }}
              aria-pressed={brand === key}
              className={
                brand === key
                  ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
                  : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground'
              }
            >
              <span dir="ltr">{key.toUpperCase() === 'DAF' || key.toUpperCase() === 'MAN' ? key.toUpperCase() : key}</span>
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="sr-only">{t.products.categoriesLabel}</span>
          <button
            type="button"
            onClick={() => { setCategory('all'); setPage(1) }}
            aria-pressed={category === 'all'}
            className={
              category === 'all'
                ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
                : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground'
            }
          >
            {t.common.all}
          </button>
          {availableCategories.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setCategory(key); setPage(1) }}
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
                setBrand('all')
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
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paged.map((part) => (
                <ProductCard key={part.slug} part={part} />
              ))}
            </div>

            {totalPages > 1 && (
              <Paginator current={safePage} total={totalPages} onChange={goToPage} prevLabel={t.common.prevPage} nextLabel={t.common.nextPage} />
            )}
          </>
        )}
      </section>
    </>
  )
}
