import 'server-only'

import type { Localized } from '@/lib/i18n/localized'

/**
 * Everything the two vehicle ACF groups have in common.
 *
 * `importCarFields` (on `import_car`) and `saleCarFields` (on `cars`) were
 * deliberately built from the same template — same field names, same eight
 * numbered gallery/highlight groups, same nested `specs` group — so that the
 * frontend reads them with one mapper instead of two. The differences are
 * small and live in the callers: import has `origin`/`stage`/`eta_*`, sale has
 * `condition`/`previous_owners`/`availability_*`.
 *
 * This module holds the shared half: the GraphQL selections, the wire shapes,
 * the machine-value → label maps, and the coercion helpers. Anything asymmetric
 * stays in `vehicles.ts` or `sale-cars.ts`.
 */

/* ------------------------------------------------------ query fragments */

/**
 * ACF free has no repeater, so both schemas model galleries and highlights as
 * eight numbered groups. Generating the selection keeps the query honest about
 * that instead of hiding 32 near-identical lines in every query.
 */
export function galleryFields(): string {
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

export function highlightFields(): string {
  return Array.from({ length: 8 }, (_, index) => {
    const n = index + 1
    return `highlight${n} {
      itemAr
      itemEn
      itemHe
    }`
  }).join('\n')
}

/** The fields both groups share, as a GraphQL selection set. */
export function commonCarFields(): string {
  return `
    carModel
    carSubtitleAr
    carSubtitleEn
    carSubtitleHe
    bodyType
    status
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
  `
}

/* ---------------------------------------------------------- wire shapes */

export type WireImage = {
  node: { sourceUrl: string | null; altText: string | null } | null
} | null

export type WireGalleryEntry = {
  image: WireImage
  altTextAr?: string | null
  altTextEn?: string | null
  altTextHe?: string | null
} | null

export type WireHighlight = {
  itemAr?: string | null
  itemEn?: string | null
  itemHe?: string | null
} | null

/** The subset of ACF fields present on both vehicle groups. */
export type WireCommonFields = {
  carModel?: string | null
  carSubtitleAr?: string | null
  carSubtitleEn?: string | null
  carSubtitleHe?: string | null
  bodyType?: string | string[] | null
  status?: string | string[] | null
  year?: number | string | null
  mileage?: number | string | null
  price?: number | string | null
  featured?: boolean | null
  featuredImage?: WireImage
  descriptionAr?: string | null
  descriptionEn?: string | null
  descriptionHe?: string | null
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

/* ------------------------------------------------------------ constants */

/**
 * The ACF selects store machine values; these are the labels the UI shows.
 * Keeping the maps here rather than in the dictionaries means a new body type
 * only has to be added in one place, next to the schema it mirrors.
 */
export const BODY_TYPES: Record<string, Localized> = {
  van: { ar: 'فان', en: 'Van', he: 'ואן' },
  suv: { ar: 'دفع رباعي', en: 'SUV', he: 'רכב שטח' },
  pickup: { ar: 'بيك أب', en: 'Pickup', he: 'טנדר' },
  luxury_mpv: { ar: 'MPV فاخر', en: 'Luxury MPV', he: 'MPV יוקרתי' },
  truck: { ar: 'شاحنة', en: 'Truck', he: 'משאית' },
  minivan: { ar: 'ميني فان', en: 'Minivan', he: 'מיניוואן' },
}

export const TRANSMISSIONS: Record<string, Localized> = {
  auto: { ar: 'أوتوماتيك', en: 'Automatic', he: 'אוטומטי' },
  manual: { ar: 'يدوي', en: 'Manual', he: 'ידני' },
}

export const FUELS: Record<string, Localized> = {
  diesel: { ar: 'ديزل', en: 'Diesel', he: 'דיזל' },
  petrol: { ar: 'بنزين', en: 'Petrol', he: 'בנזין' },
  hybrid: { ar: 'هايبرد', en: 'Hybrid', he: 'היברידי' },
  electric: { ar: 'كهربائي', en: 'Electric', he: 'חשמלי' },
}

export const PLACEHOLDER_IMAGE = '/placeholder.svg'

/* -------------------------------------------------------------- helpers */

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function plain(value: string): Localized {
  return { ar: value, en: value, he: value }
}

/**
 * Builds a localized field, falling back across languages so a vehicle that
 * was only filled in in one language still reads correctly in the other two —
 * an empty string would otherwise render as a blank line in the UI.
 */
export function localized(
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
export function first(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return text(value[0])
  return text(value)
}

export function choice(
  value: string | string[] | null | undefined,
  map: Record<string, Localized>,
  fallback: Localized
): Localized {
  const key = first(value).toLowerCase()
  return map[key] ?? fallback
}

export function enumValue<T extends string>(
  value: string | string[] | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  const key = first(value)
  return (allowed as readonly string[]).includes(key) ? (key as T) : fallback
}

export function int(value: unknown, fallback: number): number {
  const numeric =
    typeof value === 'number' ? value : Number.parseFloat(text(value))
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback
}

export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric =
    typeof value === 'number' ? value : Number.parseFloat(text(value))
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

/** Like `nullableNumber` but zero is a legitimate answer (e.g. no owners). */
export function nullableCount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric =
    typeof value === 'number' ? value : Number.parseFloat(text(value))
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : null
}

/* --------------------------------------------------------- sub-mappers */

export function gallery(
  fields: WireCommonFields
): { src: string; alt: Localized }[] {
  const items: { src: string; alt: Localized }[] = []

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

export function highlights(fields: WireCommonFields): Localized[] {
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

export function specs(fields: WireCommonFields) {
  return {
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
  }
}
