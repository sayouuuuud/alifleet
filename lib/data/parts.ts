import type { Localized, LocalizedOrPlain } from '@/lib/i18n/localized'

/**
 * Shapes for the spare-parts catalog.
 *
 * There is deliberately no hard-coded product array here any more: every part
 * shown on the site is read live from WooCommerce through
 * `lib/wp/catalog.ts`. Hard-coded products meant hard-coded `wooId`s, and a
 * guessed product id silently hands the customer the wrong item — or an empty
 * cart — at checkout.
 */

export type PartCategory =
  | 'brakes'
  | 'engine'
  | 'lighting'
  | 'wheels'
  | 'transmission'
  | 'filters'
  | 'suspension'
  | 'electrical'
  /** Anything WooCommerce has not been filed under one of the eight above. */
  | 'other'

/**
 * The fields every product tile, search filter and cart line needs. Kept
 * separate from `Part` so a 165-product listing does not ship every long
 * description and spec table to the browser.
 */
export type PartSummary = {
  slug: string
  /** Real WooCommerce `databaseId` — the cart is handed over with this. */
  wooId: number
  sku: string
  category: PartCategory
  brand: string
  price: number
  inStock: boolean
  featured?: boolean
  image: string
  alt: Localized
  name: Localized
  /**
   * True when this product still only has its original Hebrew text, so the UI
   * can mark it up with `lang="he"` instead of lying about the language.
   */
  untranslated?: boolean
}

/** A full product, as needed by the detail page. */
export type Part = PartSummary & {
  description: Localized
  specs: { label: Localized; value: LocalizedOrPlain }[]
  compatibility: string[]
}

/** Filter chips on the catalog page, in display order. */
export const partCategories: PartCategory[] = [
  'brakes',
  'engine',
  'lighting',
  'wheels',
  'transmission',
  'filters',
  'suspension',
  'electrical',
  'other',
]

export function isPartCategory(value: unknown): value is PartCategory {
  return (
    typeof value === 'string' &&
    (partCategories as readonly string[]).includes(value)
  )
}

/** Narrows a full product down to what the listing and cart actually render. */
export function toSummary(part: Part): PartSummary {
  return {
    slug: part.slug,
    wooId: part.wooId,
    sku: part.sku,
    category: part.category,
    brand: part.brand,
    price: part.price,
    inStock: part.inStock,
    featured: part.featured,
    image: part.image,
    alt: part.alt,
    name: part.name,
    untranslated: part.untranslated,
  }
}
