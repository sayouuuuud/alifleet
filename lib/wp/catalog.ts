import 'server-only'

import type { Part, PartCategory, PartSummary } from '@/lib/data/parts'
import { isPartCategory, toSummary } from '@/lib/data/parts'
import { hashToken } from '@/lib/search/match'
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
          searchTerms
          oeNumber
          spec1 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec2 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec3 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec4 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec5 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec6 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec7 { labelAr labelEn labelHe valueAr valueEn valueHe }
          spec8 { labelAr labelEn labelHe valueAr valueEn valueHe }
          compatModel1 { modelName }
          compatModel2 { modelName }
          compatModel3 { modelName }
          compatModel4 { modelName }
          compatModel5 { modelName }
          compatModel6 { modelName }
          compatModel7 { modelName }
          compatModel8 { modelName }
          compatModel9 { modelName }
          compatModel10 { modelName }
        }
      }
    }
  }
`

/* -------------------------------------------------- ACF spec / fitment groups */

function acfText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** spec_1..spec_8: a row counts when it has a label and a value in any language. */
function readSpecs(acf: WireMeta['sparePartFields'] | undefined): Part['specs'] {
  if (!acf) return []
  const specs: Part['specs'] = []
  for (let i = 1; i <= 8; i++) {
    const row = acf[`spec${i}`]
    if (!row) continue
    const label = { ar: acfText(row.labelAr), en: acfText(row.labelEn), he: acfText(row.labelHe) }
    const value = { ar: acfText(row.valueAr), en: acfText(row.valueEn), he: acfText(row.valueHe) }
    if (!(label.he || label.en || label.ar) || !(value.he || value.en || value.ar)) continue
    specs.push({
      label: { ar: label.ar || label.he || label.en, en: label.en || label.he || label.ar, he: label.he || label.en || label.ar },
      value: { ar: value.ar || value.he || value.en, en: value.en || value.he || value.ar, he: value.he || value.en || value.ar },
    })
  }
  return specs
}

/** compat_model_1..10: plain model names ("DAF XF 2021+"). */
function readCompatibility(acf: WireMeta['sparePartFields'] | undefined): string[] {
  if (!acf) return []
  const out: string[] = []
  for (let i = 1; i <= 10; i++) {
    const name = acfText(acf[`compatModel${i}`]?.modelName)
    if (name) out.push(name)
  }
  return out
}

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
  sparePartFields: ({
    nameAr?: string | null
    nameEn?: string | null
    brand?: string | null
    sku?: string | null
    partCategory?: string | string[] | null
    featured?: boolean | null
    descriptionAr?: string | null
    descriptionEn?: string | null
    searchTerms?: string | null
    oeNumber?: string | null
  } & Record<`spec${number}`, WireSpec | null | undefined> &
    Record<`compatModel${number}`, { modelName?: string | null } | null | undefined>
  ) | null
}

type WireSpec = {
  labelAr?: string | null
  labelEn?: string | null
  labelHe?: string | null
  valueAr?: string | null
  valueEn?: string | null
  valueHe?: string | null
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

  // The long description carries the fitment and 'also known as' lines that
  // matter for search; the short blurb is only a fallback
  // because plenty of WooCommerce products only fill in the latter.
  const hebrewDescription =
    stripHtml(product.description ?? '') ||
    stripHtml(product.shortDescription ?? '')
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
    specs: readSpecs(acf),
    compatibility: readCompatibility(acf),
    searchTerms: acfText(acf?.searchTerms) || undefined,
    // The OE number itself stays on the server; only its hash reaches the browser.
    searchHashes: acfText(acf?.oeNumber) ? [hashToken(acfText(acf?.oeNumber))] : undefined,
  }
}

/** WooCommerce RAW prices arrive as strings such as `"3180.00"`. */
function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0
  const numeric = Number.parseFloat(raw.replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * Keyword map for products that were never filed under one of the nine
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
  body: ['מדרגה', 'מדרגת', 'גריל', 'מראה', 'מראת', 'פגוש', 'משקפים', 'מסית רוח', 'מסיט רוח', 'כנף', 'לוח', 'מכסה', 'כיסוי', 'ידית', 'מגן שמש', 'מגן בוץ', 'מגן פוטס', 'סמל', 'step', 'grille', 'mirror', 'bumper', 'panel', 'cover', 'handle', 'visor', 'deflector', 'emblem', 'badge', 'fender', 'mud guard'],
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
