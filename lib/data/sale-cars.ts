import type { Localized } from '@/lib/i18n/localized'

/**
 * A car already in the yard, listed for direct sale — the `cars` post type in
 * WordPress, edited through the `saleCarFields` ACF group.
 *
 * It is deliberately close to `ImportCar` so the two sections of /cars can
 * share cards, formatting and the mapper. Three fields differ, and the
 * difference is the point: an import is described by where it is coming *from*
 * and how far along the shipment is, while a car on the lot is described by its
 * condition, its history and when it can be handed over.
 */

/** No `inTransit` here — a car on the lot has already arrived. */
export type SaleCarStatus = 'available' | 'reserved' | 'sold'
export type SaleCarCondition = 'new' | 'used' | 'demo'

export type SaleCar = {
  slug: string
  /** Display name is language-neutral (make + model), the subtitle is localized. */
  model: string
  subtitle: Localized
  bodyType: Localized
  condition: SaleCarCondition
  status: SaleCarStatus
  year: number
  /** Kilometres. Hidden in the UI when the condition is `new`. */
  mileage: number
  /** Asking price. `null` renders as "on request". */
  price: number | null
  /** `null` when the editor left it blank — 0 means "first owner". */
  previousOwners: number | null
  featured?: boolean
  image: string
  alt: Localized
  gallery: { src: string; alt: Localized }[]
  description: Localized
  highlights: Localized[]
  specs: {
    engine: string
    transmission: Localized
    fuel: Localized
    drivetrain: string
    color: Localized
    seats: number
  }
  /** Handover note, e.g. "ready for immediate delivery". */
  availability: Localized
}

export const saleCarStatuses: SaleCarStatus[] = ['available', 'reserved', 'sold']
export const saleCarConditions: SaleCarCondition[] = ['new', 'used', 'demo']
