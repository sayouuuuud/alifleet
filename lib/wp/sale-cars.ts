import 'server-only'

import type { SaleCar, SaleCarCondition, SaleCarStatus } from '@/lib/data/sale-cars'
import { saleCarConditions, saleCarStatuses } from '@/lib/data/sale-cars'
import { stripHtml } from '@/lib/i18n/machine-translations'
import { CATALOG_REVALIDATE, isWpConfigured } from './config'
import { wpFetch } from './client'
import {
  BODY_TYPES,
  PLACEHOLDER_IMAGE,
  type WireCommonFields,
  type WireImage,
  choice,
  commonCarFields,
  enumValue,
  gallery,
  highlights,
  int,
  localized,
  nullableCount,
  nullableNumber,
  plain,
  specs,
  text,
} from './car-fields'

/**
 * The cars-for-sale inventory, read from the `cars` post type.
 *
 * As with imports, core WordPress only supplies the title and thumbnail —
 * price, year, condition and every localized string live in the
 * `saleCarFields` ACF group (see `wordpress/acf/build-sale-car-group.mjs`).
 * That makes ACF a hard dependency, so a missing plugin is surfaced as its own
 * status rather than rendering a grid of cars with blank prices.
 */

const PAGE_SIZE = 50
const MAX_PAGES = 10

/* ------------------------------------------------------------------ query */

const SALE_CARS_QUERY = /* GraphQL */ `
  query AliFleetSaleCars($first: Int!, $after: String) {
    saleCars(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        saleCarFields {
          ${commonCarFields()}
          condition
          previousOwners
          availabilityAr
          availabilityEn
          availabilityHe
        }
      }
    }
  }
`

/* -------------------------------------------------------------- wire shapes */

type WireSaleFields = WireCommonFields & {
  condition?: string | string[] | null
  previousOwners?: number | string | null
  availabilityAr?: string | null
  availabilityEn?: string | null
  availabilityHe?: string | null
}

type WireSaleCar = {
  databaseId: number
  slug: string | null
  title: string | null
  featuredImage?: WireImage
  saleCarFields: WireSaleFields | null
}

type PagedSaleCars = {
  saleCars: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: WireSaleCar[]
  } | null
}

export type SaleCarsStatus =
  | 'ok'
  | 'not_configured'
  | 'unreachable'
  | 'empty'
  /** Reached WordPress, but `saleCarFields` is missing from the schema. */
  | 'acf_missing'

export type SaleInventory = {
  cars: SaleCar[]
  status: SaleCarsStatus
}

/* ----------------------------------------------------------------- fetching */

/**
 * Reads the published for-sale inventory. Never throws — a missing ACF plugin,
 * an unreachable store and an empty inventory are three different states the UI
 * needs to tell apart.
 */
export async function getSaleCars(): Promise<SaleInventory> {
  if (!isWpConfigured()) {
    return { cars: [], status: 'not_configured' }
  }

  const collected: WireSaleCar[] = []
  let after: string | null = null

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const data: PagedSaleCars = await wpFetch<PagedSaleCars>(
        SALE_CARS_QUERY,
        { first: PAGE_SIZE, after },
        { revalidate: CATALOG_REVALIDATE }
      )
      const connection = data.saleCars
      if (!connection) break

      collected.push(...connection.nodes)
      if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
        break
      }
      after = connection.pageInfo.endCursor
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // A schema error is a setup problem, not an outage, and the fix is
    // completely different — so it gets its own status.
    if (/saleCarFields|saleCars|Cannot query field/i.test(message)) {
      console.log(
        '[v0] Sale inventory needs WPGraphQL for ACF — saleCarFields is not in the schema:',
        message
      )
      return { cars: [], status: 'acf_missing' }
    }
    console.log('[v0] Sale inventory fetch failed:', message)
    return { cars: [], status: 'unreachable' }
  }

  if (collected.length === 0) {
    return { cars: [], status: 'empty' }
  }

  const cars = collected
    .map(mapSaleCar)
    .filter((car): car is SaleCar => car !== null)
    // Featured listings are pinned, then the newest model years lead.
    .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))

  return { cars, status: cars.length > 0 ? 'ok' : 'empty' }
}

export async function getSaleCar(slug: string): Promise<SaleCar | null> {
  const { cars } = await getSaleCars()
  return cars.find((car) => car.slug === slug) ?? null
}

/**
 * Same body type first, then anything else, so the rail is never half empty
 * when a body type only holds one vehicle.
 */
export async function getSimilarSaleCars(
  car: SaleCar,
  limit = 3
): Promise<SaleCar[]> {
  const { cars } = await getSaleCars()
  const others = cars.filter((item) => item.slug !== car.slug)
  return [
    ...others.filter((item) => item.bodyType.en === car.bodyType.en),
    ...others.filter((item) => item.bodyType.en !== car.bodyType.en),
  ].slice(0, limit)
}

/* ------------------------------------------------------------------ mapping */

function mapSaleCar(node: WireSaleCar): SaleCar | null {
  const slug = node.slug?.trim()
  const fields = node.saleCarFields
  if (!slug || !fields) return null

  // The post title is the safety net: a listing with no ACF model name still
  // needs something to render, and the title is what the editor typed. The
  // three seeded cars were created before the field group existed, so this
  // path is the live one until they are filled in.
  const model = text(fields.carModel) || stripHtml(node.title ?? '')
  if (!model) return null

  // ACF's own image field wins over the post thumbnail, because the schema
  // gives editors a dedicated field and that is the one they fill in.
  const heroNode = fields.featuredImage?.node ?? node.featuredImage?.node ?? null
  const heroAlt = text(heroNode?.altText)

  const subtitle = localized(
    fields.carSubtitleAr,
    fields.carSubtitleEn,
    fields.carSubtitleHe,
    model
  )

  return {
    slug,
    model,
    subtitle,
    bodyType: choice(fields.bodyType, BODY_TYPES, {
      ar: 'مركبة',
      en: 'Vehicle',
      he: 'רכב',
    }),
    condition: enumValue<SaleCarCondition>(
      fields.condition,
      saleCarConditions,
      'used'
    ),
    status: enumValue<SaleCarStatus>(fields.status, saleCarStatuses, 'available'),
    year: int(fields.year, new Date().getFullYear()),
    mileage: int(fields.mileage, 0),
    // Null is meaningful: the UI renders "on request" for it, so an unpriced
    // listing must not collapse to a misleading 0.
    price: nullableNumber(fields.price),
    previousOwners: nullableCount(fields.previousOwners),
    featured: fields.featured ?? undefined,
    image: heroNode?.sourceUrl || PLACEHOLDER_IMAGE,
    alt: heroAlt ? plain(heroAlt) : subtitle,
    gallery: gallery(fields),
    description: localized(
      fields.descriptionAr,
      fields.descriptionEn,
      fields.descriptionHe,
      ''
    ),
    highlights: highlights(fields),
    specs: specs(fields),
    availability: localized(
      fields.availabilityAr,
      fields.availabilityEn,
      fields.availabilityHe,
      ''
    ),
  }
}
