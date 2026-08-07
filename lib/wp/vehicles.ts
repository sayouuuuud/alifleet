import 'server-only'

import type {
  CarOrigin,
  CarStatus,
  ImportCar,
} from '@/lib/data/import-cars'
import { carOrigins, carStatuses } from '@/lib/data/import-cars'
import type { Localized } from '@/lib/i18n/localized'
import { stripHtml } from '@/lib/i18n/machine-translations'
import { CATALOG_REVALIDATE, isWpConfigured } from './config'
import { wpFetch } from './client'

/**
 * The live import-vehicle inventory, read from the `import_car` post type.
 *
 * Unlike the spare-parts catalog, a vehicle carries almost no useful data in
 * core WordPress fields — the title and featured image are all core gives us.
 * Year, mileage, price, origin, status and every localized string live in the
 * `importCarFields` ACF group (see `wordpress/acf/alifleet-acf-schema.json`).
 *
 * That makes ACF a hard dependency here, so the failure is reported rather than
 * hidden: if `wpgraphql-acf` is inactive the whole query fails and the page
 * says the inventory is unavailable, instead of rendering a grid of cars with
 * blank prices and no year.
 */

const PAGE_SIZE = 50
const MAX_PAGES = 10

/* ------------------------------------------------------------------ queries */

/**
 * A single request, because ACF is not optional for vehicles. `importCarFields`
 * only exists once the ACF schema is imported and `wpgraphql-acf` is active.
 */
const VEHICLES_QUERY = /* GraphQL */ `
  query AliFleetVehicles($first: Int!, $after: String) {
    importCars(first: $first, after: $after, where: { status: PUBLISH }) {
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
        importCarFields {
          carModel
          carSubtitleAr
          carSubtitleEn
          carSubtitleHe
          bodyType
          origin
          status
          stage
          year
          mileage
          price
          featured
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          descriptionAr
          descriptionEn
          descriptionHe
          etaAr
          etaEn
          etaHe
          specs {
            engine
            transmission
            fuel
            drivetrain
            colorAr
            colorEn
            colorHe
            seats
          }
          ${galleryFields()}
          ${highlightFields()}
        }
      }
    }
  }
`

/**
 * ACF has no repeater in the free tier, so the schema uses eight numbered
 * groups. Generating the selection keeps the query honest about that instead of
 * hiding 32 near-identical lines.
 */
function galleryFields(): string {
  return Array.from({ length: 8 }, (_, index) => {
    const n = index + 1
    return `galleryImage${n} {
      image {
        node {
          sourceUrl
          altText
        }
      }
      altTextAr
      altTextEn
      altTextHe
    }`
  }).join('\n')
}

function highlightFields(): string {
  return Array.from({ length: 8 }, (_, index) => {
    const n = index + 1
    return `highlight${n} {
      itemAr
      itemEn
      itemHe
    }`
  }).join('\n')
}

/* -------------------------------------------------------------- wire shapes */

type WireImage = {
  node: { sourceUrl: string | null; altText: string | null } | null
} | null

type WireGalleryEntry = {
  image: WireImage
  altTextAr?: string | null
  altTextEn?: string | null
  altTextHe?: string | null
} | null

type WireHighlight = {
  itemAr?: string | null
  itemEn?: string | null
  itemHe?: string | null
} | null

type WireCarFields = {
  carModel?: string | null
  carSubtitleAr?: string | null
  carSubtitleEn?: string | null
  carSubtitleHe?: string | null
  bodyType?: string | string[] | null
  origin?: string | string[] | null
  status?: string | string[] | null
  stage?: number | string | null
  year?: number | string | null
  mileage?: number | string | null
  price?: number | string | null
  featured?: boolean | null
  featuredImage?: WireImage
  descriptionAr?: string | null
  descriptionEn?: string | null
  descriptionHe?: string | null
  etaAr?: string | null
  etaEn?: string | null
  etaHe?: string | null
  specs?: {
    engine?: string | null
    transmission?: string | string[] | null
    fuel?: string | string[] | null
    drivetrain?: string | null
    colorAr?: string | null
    colorEn?: string | null
    colorHe?: string | null
    seats?: number | string | null
  } | null
} & Record<string, unknown>

type WireCar = {
  databaseId: number
  slug: string | null
  title: string | null
  featuredImage?: WireImage
  importCarFields: WireCarFields | null
}

type PagedCars = {
  importCars: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: WireCar[]
  } | null
}

export type VehiclesStatus =
  | 'ok'
  | 'not_configured'
  | 'unreachable'
  | 'empty'
  /** Reached WordPress, but `importCarFields` is missing from the schema. */
  | 'acf_missing'

export type VehicleInventory = {
  cars: ImportCar[]
  status: VehiclesStatus
}

/* ---------------------------------------------------------------- constants */

/**
 * The ACF selects store machine values; these are the labels the UI shows.
 * Keeping the map here rather than in the dictionaries means a new body type
 * only has to be added in one place, next to the schema it mirrors.
 */
const BODY_TYPES: Record<string, Localized> = {
  van: { ar: 'فان', en: 'Van', he: 'ואן' },
  suv: { ar: 'دفع رباعي', en: 'SUV', he: 'רכב שטח' },
  pickup: { ar: 'بيك أب', en: 'Pickup', he: 'טנדר' },
  luxury_mpv: { ar: 'MPV فاخر', en: 'Luxury MPV', he: 'MPV יוקרתי' },
  truck: { ar: 'شاحنة', en: 'Truck', he: 'משאית' },
  minivan: { ar: 'ميني فان', en: 'Minivan', he: 'מיניוואן' },
}

const TRANSMISSIONS: Record<string, Localized> = {
  auto: { ar: 'أوتوماتيك', en: 'Automatic', he: 'אוטומטי' },
  manual: { ar: 'يدوي', en: 'Manual', he: 'ידני' },
}

const FUELS: Record<string, Localized> = {
  diesel: { ar: 'ديزل', en: 'Diesel', he: 'דיזל' },
  petrol: { ar: 'بنزين', en: 'Petrol', he: 'בנזין' },
  hybrid: { ar: 'هايبرد', en: 'Hybrid', he: 'היברידי' },
  electric: { ar: 'كهربائي', en: 'Electric', he: 'חשמלי' },
}

const PLACEHOLDER_IMAGE = '/placeholder.svg'

/* ----------------------------------------------------------------- fetching */

/**
 * Reads the published inventory. Never throws — a missing ACF plugin, an
 * unreachable store and an empty inventory are three different states the UI
 * needs to tell apart.
 */
export async function getVehicles(): Promise<VehicleInventory> {
  if (!isWpConfigured()) {
    return { cars: [], status: 'not_configured' }
  }

  const collected: WireCar[] = []
  let after: string | null = null

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const data: PagedCars = await wpFetch<PagedCars>(
        VEHICLES_QUERY,
        { first: PAGE_SIZE, after },
        { revalidate: CATALOG_REVALIDATE }
      )
      const connection = data.importCars
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
    if (/importCarFields|Cannot query field/i.test(message)) {
      console.log(
        '[v0] Vehicle inventory needs WPGraphQL for ACF — importCarFields is not in the schema:',
        message
      )
      return { cars: [], status: 'acf_missing' }
    }
    console.log('[v0] Vehicle inventory fetch failed:', message)
    return { cars: [], status: 'unreachable' }
  }

  if (collected.length === 0) {
    return { cars: [], status: 'empty' }
  }

  const cars = collected
    .map(mapCar)
    .filter((car): car is ImportCar => car !== null)

  return { cars, status: cars.length > 0 ? 'ok' : 'empty' }
}

export async function getVehicle(slug: string): Promise<ImportCar | null> {
  const { cars } = await getVehicles()
  return cars.find((car) => car.slug === slug) ?? null
}

/**
 * Same body type first, then anything else, so the rail is never half empty
 * when a body type only holds one vehicle.
 */
export async function getSimilarVehicles(
  car: ImportCar,
  limit = 3
): Promise<ImportCar[]> {
  const { cars } = await getVehicles()
  const others = cars.filter((item) => item.slug !== car.slug)
  return [
    ...others.filter((item) => item.bodyType.en === car.bodyType.en),
    ...others.filter((item) => item.bodyType.en !== car.bodyType.en),
  ].slice(0, limit)
}

/* ------------------------------------------------------------------ mapping */

function mapCar(node: WireCar): ImportCar | null {
  const slug = node.slug?.trim()
  const fields = node.importCarFields
  if (!slug || !fields) return null

  // The post title is the safety net: a vehicle with no ACF model name still
  // needs something to render, and the title is what the editor typed.
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
    origin: enumValue<CarOrigin>(fields.origin, carOrigins, 'germany'),
    status: enumValue<CarStatus>(fields.status, carStatuses, 'available'),
    stage: stage(fields.stage),
    year: int(fields.year, new Date().getFullYear()),
    mileage: int(fields.mileage, 0),
    // Null is meaningful: the detail page renders "on request" for it, so an
    // unpriced vehicle must not collapse to a misleading 0.
    price: nullableNumber(fields.price),
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
    specs: {
      engine: text(fields.specs?.engine),
      transmission: choice(
        fields.specs?.transmission,
        TRANSMISSIONS,
        TRANSMISSIONS.auto
      ),
      fuel: choice(fields.specs?.fuel, FUELS, FUELS.diesel),
      drivetrain: text(fields.specs?.drivetrain),
      color: localized(
        fields.specs?.colorAr,
        fields.specs?.colorEn,
        fields.specs?.colorHe,
        ''
      ),
      seats: int(fields.specs?.seats, 0),
    },
    eta: localized(fields.etaAr, fields.etaEn, fields.etaHe, ''),
  }
}

function gallery(fields: WireCarFields): ImportCar['gallery'] {
  const items: ImportCar['gallery'] = []

  for (let n = 1; n <= 8; n++) {
    const entry = fields[`galleryImage${n}`] as WireGalleryEntry
    const src = entry?.image?.node?.sourceUrl
    // An empty ACF group is the normal case — most vehicles use two or three
    // photos, not eight — so a missing image is skipped, never placeholdered.
    if (!entry || !src) continue

    const alt = localized(
      entry.altTextAr,
      entry.altTextEn,
      entry.altTextHe,
      text(entry.image?.node?.altText)
    )
    items.push({ src, alt })
  }

  return items
}

function highlights(fields: WireCarFields): Localized[] {
  const items: Localized[] = []

  for (let n = 1; n <= 8; n++) {
    const entry = fields[`highlight${n}`] as WireHighlight
    if (!entry) continue

    const ar = text(entry.itemAr)
    const en = text(entry.itemEn)
    const he = text(entry.itemHe)
    if (!ar && !en && !he) continue

    items.push(localized(ar, en, he, ''))
  }

  return items
}

/* ------------------------------------------------------------------ helpers */

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function plain(value: string): Localized {
  return { ar: value, en: value, he: value }
}

/**
 * Builds a localized field, falling back across languages so a vehicle that
 * was only filled in in one language still reads correctly in the other two —
 * an empty string would otherwise render as a blank line in the UI.
 */
function localized(
  ar: unknown,
  en: unknown,
  he: unknown,
  fallback: string
): Localized {
  const a = text(ar)
  const e = text(en)
  const h = text(he)
  const any = a || e || h || fallback

  return { ar: a || any, en: e || any, he: h || any }
}

/** ACF selects can return a bare value or a single-item array. */
function first(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return text(value[0])
  return text(value)
}

function choice(
  value: string | string[] | null | undefined,
  map: Record<string, Localized>,
  fallback: Localized
): Localized {
  const key = first(value).toLowerCase()
  return map[key] ?? fallback
}

function enumValue<T extends string>(
  value: string | string[] | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  const key = first(value)
  return (allowed as readonly string[]).includes(key) ? (key as T) : fallback
}

function int(value: unknown, fallback: number): number {
  const numeric =
    typeof value === 'number' ? value : Number.parseFloat(text(value))
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric =
    typeof value === 'number' ? value : Number.parseFloat(text(value))
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

/** The four import steps; anything outside 1–4 is meaningless. */
function stage(value: unknown): ImportCar['stage'] {
  const numeric = int(value, 1)
  if (numeric >= 1 && numeric <= 4) return numeric as ImportCar['stage']
  return 1
}
