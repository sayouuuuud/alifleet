import 'server-only'

import type { Part, PartCategory, PartSummary } from '@/lib/data/parts'
import { isPartCategory, toSummary } from '@/lib/data/parts'
import { localizeHebrew, stripHtml } from '@/lib/i18n/machine-translations'
import { CATALOG_REVALIDATE, isWpConfigured } from './config'
import { wpFetch } from './client'

/**
 * The live spare-parts catalog, read from WooCommerce through WPGraphQL.
 *
 * Two things drove the shape of this module:
 *
 * 1. **Product ids are never guessed.** Every part carries the real
 *    `databaseId` straight from WooCommerce, so `?add-to-cart=<id>` at
 *    checkout always resolves to the product the customer actually saw.
 *
 * 2. **The store predates this frontend.** Most products only have their
 *    original Hebrew title, no brand, and no part category, so every field the
 *    UI needs is derived defensively: the curated ACF metadata is used when it
 *    exists, WooCommerce's own data when it does not, and the Hebrew original
 *    as the last resort.
 */

/** WooCommerce paginates; this is the page size, not a catalog limit. */
const PAGE_SIZE = 100
/** Hard stop so a runaway cursor can never loop forever. */
const MAX_PAGES = 12

/* ------------------------------------------------------------------ queries */

/**
 * Tier 1 — must succeed. Only fields that exist in a stock
 * WooCommerce + WooGraphQL install.
 */
const CATALOG_QUERY = /* GraphQL */ `
  query AliFleetCatalog($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        slug
        name
        description
        shortDescription
        image {
          sourceUrl
          altText
        }
        productCategories(first: 8) {
          nodes {
            slug
            name
          }
        }
        ... on SimpleProduct {
          sku
          stockStatus
          rawPrice: price(format: RAW)
        }
        ... on VariableProduct {
          sku
          stockStatus
          rawPrice: price(format: RAW)
        }
        ... on ExternalProduct {
          sku
          rawPrice: price(format: RAW)
        }
        ... on GroupProduct {
          sku
        }
      }
    }
  }
`

/**
 * Tier 2 — best effort. `sparePartFields` only exists once the ACF schema from
 * `wordpress/acf/alifleet-acf-schema.json` is imported and `wpgraphql-acf` is
 * active. When it is missing the whole request fails with
 * `Cannot query field "sparePartFields"`, which must not take the catalog down
 * with it — hence a separate request whose failure is swallowed.
 */
const ENRICHMENT_QUERY = /* GraphQL */ `
  query AliFleetCatalogMeta($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        sparePartFields {
          nameAr
          nameEn
          brand
          sku
          partCategory
          featured
          descriptionAr
          descriptionEn
        }
      }
    }
  }
`

/* -------------------------------------------------------------- wire shapes */

type WireProduct = {
  databaseId: number
  slug: string | null
  name: string | null
  description: string | null
  shortDescription: string | null
  image: { sourceUrl: string | null; altText: string | null } | null
  productCategories: { nodes: { slug: string; name: string }[] } | null
  sku?: string | null
  stockStatus?: string | null
  rawPrice?: string | null
}

type WireMeta = {
  databaseId: number
  sparePartFields: {
    nameAr?: string | null
    nameEn?: string | null
    brand?: string | null
    sku?: string | null
    partCategory?: string | string[] | null
    featured?: boolean | null
    descriptionAr?: string | null
    descriptionEn?: string | null
  } | null
}

type Paged<T> = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: T[]
  } | null
}

/** Why the catalog came back empty, so the UI can say something useful. */
export type CatalogStatus = 'ok' | 'not_configured' | 'unreachable' | 'empty'

export type Catalog = {
  parts: Part[]
  status: CatalogStatus
  /** True when at least one product is still showing untranslated Hebrew. */
  hasUntranslated: boolean
}

/* ----------------------------------------------------------------- fetching */

async function fetchAllPages<T>(
  query: string,
  label: string
): Promise<T[] | null> {
  const collected: T[] = []
  let after: string | null = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const data: Paged<T> = await wpFetch<Paged<T>>(
      query,
      { first: PAGE_SIZE, after },
      { revalidate: CATALOG_REVALIDATE }
    )
    const connection = data.products
    if (!connection) break

    collected.push(...connection.nodes)
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
      return collected
    }
    after = connection.pageInfo.endCursor
  }

  console.log(
    `[v0] ${label}: stopped at the ${MAX_PAGES}-page guard with ${collected.length} items`
  )
  return collected
}

/**
 * Reads the whole catalog. Never throws: a store that is down or not yet
 * configured returns an empty catalog plus the reason why.
 */
export async function getCatalog(): Promise<Catalog> {
  if (!isWpConfigured()) {
    return { parts: [], status: 'not_configured', hasUntranslated: false }
  }

  let products: WireProduct[] | null
  try {
    products = await fetchAllPages<WireProduct>(CATALOG_QUERY, 'catalog')
  } catch (error) {
    console.log('[v0] Catalog fetch failed:', error)
    return { parts: [], status: 'unreachable', hasUntranslated: false }
  }

  if (!products || products.length === 0) {
    return { parts: [], status: 'empty', hasUntranslated: false }
  }

  // Curated ACF metadata is a bonus, never a requirement.
  const meta = new Map<number, NonNullable<WireMeta['sparePartFields']>>()
  try {
    const rows = await fetchAllPages<WireMeta>(ENRICHMENT_QUERY, 'catalog meta')
    for (const row of rows ?? []) {
      if (row.sparePartFields) meta.set(row.databaseId, row.sparePartFields)
    }
  } catch (error) {
    console.log(
      '[v0] ACF product metadata unavailable — falling back to WooCommerce fields only:',
      error instanceof Error ? error.message : error
    )
  }

  const parts = products
    .map((product) => mapProduct(product, meta.get(product.databaseId)))
    .filter((part): part is Part => part !== null)

  return {
    parts,
    status: parts.length > 0 ? 'ok' : 'empty',
    hasUntranslated: parts.some((part) => part.untranslated),
  }
}

/** The trimmed catalog used by the listing page and the cart. */
export async function getCatalogSummaries(): Promise<{
  parts: PartSummary[]
  status: CatalogStatus
  hasUntranslated: boolean
}> {
  const { parts, status, hasUntranslated } = await getCatalog()
  return { parts: parts.map(toSummary), status, hasUntranslated }
}

export async function getPart(slug: string): Promise<Part | null> {
  const { parts } = await getCatalog()
  return parts.find((part) => part.slug === slug) ?? null
}

/**
 * Related products: same category first, then anything else, so the rail is
 * never half empty on a category that only holds one product.
 */
export async function getRelatedParts(
  part: Part,
  limit = 4
): Promise<PartSummary[]> {
  const { parts } = await getCatalog()
  const others = parts.filter((item) => item.slug !== part.slug)
  return [
    ...others.filter((item) => item.category === part.category),
    ...others.filter((item) => item.category !== part.category),
  ]
    .slice(0, limit)
    .map(toSummary)
}

/* ------------------------------------------------------------------ mapping */

function mapProduct(
  product: WireProduct,
  acf: NonNullable<WireMeta['sparePartFields']> | undefined
): Part | null {
  const slug = product.slug?.trim()
  const hebrewName = stripHtml(product.name ?? '')
  if (!slug || !hebrewName) return null

  const name = localizeHebrew(hebrewName, {
    ar: acf?.nameAr,
    en: acf?.nameEn,
  })

  // The short description is the product blurb; the long one is the fallback
  // because plenty of WooCommerce products only fill in the latter.
  const hebrewDescription =
    stripHtml(product.shortDescription ?? '') ||
    stripHtml(product.description ?? '')
  const description = localizeHebrew(hebrewDescription, {
    ar: acf?.descriptionAr,
    en: acf?.descriptionEn,
  })

  const categoryNames = product.productCategories?.nodes ?? []
  const category = resolveCategory(acf?.partCategory, categoryNames, hebrewName)

  // Media library alt text is often empty, in which case the product title is
  // the most useful description of the image we have.
  const altText = stripHtml(product.image?.altText ?? '')
  const alt = altText ? localizeHebrew(altText) : name

  return {
    slug,
    wooId: product.databaseId,
    sku: (acf?.sku || product.sku || '').trim(),
    category,
    brand: (acf?.brand || '').trim(),
    price: parsePrice(product.rawPrice),
    inStock: product.stockStatus !== 'OUT_OF_STOCK',
    featured: acf?.featured ?? undefined,
    image: product.image?.sourceUrl || '/placeholder.svg',
    alt: alt.value,
    name: name.value,
    untranslated: !name.translated,
    description: description.value,
    // Specs and fitment lists only exist for the curated products and are not
    // invented here — the detail page hides both sections when they are empty.
    specs: [],
    compatibility: [],
  }
}

/** WooCommerce RAW prices arrive as strings such as `"3180.00"`. */
function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0
  const numeric = Number.parseFloat(raw.replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * Keyword map for products that were never filed under one of the eight
 * frontend categories. It reads the WooCommerce category names first — those
 * are what the shop owner actually chose — and only then the product title.
 */
const CATEGORY_KEYWORDS: Record<Exclude<PartCategory, 'other'>, string[]> = {
  brakes: ['בלם', 'בלמים', 'רפידות', 'רפידה', 'דיסק', 'צלחת', 'brake', 'pad', 'disc', 'caliper'],
  engine: ['מנוע', 'בוכנה', 'טורבו', 'אטם', 'ראש מנוע', 'engine', 'turbo', 'piston', 'gasket', 'motor'],
  lighting: ['פנס', 'פנסים', 'נורה', 'תאורה', 'light', 'lamp', 'headlight', 'led'],
  wheels: ['גלגל', 'גלגלים', 'צמיג', 'חישוק', 'מסב', 'wheel', 'tyre', 'tire', 'rim', 'hub', 'bearing'],
  transmission: ['גיר', 'תמסורת', 'מצמד', 'ציריה', 'transmission', 'gearbox', 'clutch', 'axle'],
  filters: ['מסנן', 'מסננים', 'פילטר', 'filter'],
  suspension: ['מתלה', 'מתלים', 'קפיץ', 'בולם', 'זרוע', 'suspension', 'shock', 'spring', 'strut', 'arm'],
  electrical: ['חשמל', 'אלטרנטור', 'מצבר', 'סטרטר', 'חיישן', 'alternator', 'battery', 'starter', 'sensor', 'relay', 'coil'],
}

function resolveCategory(
  acfCategory: unknown,
  wooCategories: { slug: string; name: string }[],
  productName: string
): PartCategory {
  // ACF `select` fields return a string; `checkbox` fields return an array.
  // When WPGraphQL for ACF is inactive the value may be {} (empty object).
  const raw = Array.isArray(acfCategory)
    ? (acfCategory[0] as string | undefined)
    : typeof acfCategory === 'string'
      ? acfCategory
      : undefined
  const curated = raw?.trim().toLowerCase()
  if (isPartCategory(curated)) return curated

  const haystacks = [
    ...wooCategories.flatMap((category) => [category.slug, category.name]),
    productName,
  ].map((value) => value.toLowerCase())

  for (const haystack of haystacks) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
        return category as PartCategory
      }
    }
  }

  return 'other'
}
