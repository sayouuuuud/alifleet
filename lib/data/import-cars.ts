import type { Localized } from '@/lib/i18n/localized'

export type CarOrigin = 'germany' | 'uae' | 'usa' | 'japan' | 'korea' | 'belgium'
export type CarStatus = 'available' | 'inTransit' | 'reserved' | 'sold'

export type ImportCar = {
  slug: string
  /** Display name is language-neutral (make + model), the subtitle is localized. */
  model: string
  subtitle: Localized
  bodyType: Localized
  origin: CarOrigin
  status: CarStatus
  /** 1–4, matching the four import steps — how far this unit has progressed. */
  stage: 1 | 2 | 3 | 4
  year: number
  /** Kilometres. 0 means brand new. */
  mileage: number
  /** Estimated landed price. `null` renders as "on request". */
  price: number | null
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
  eta: Localized
}

export const carOrigins: CarOrigin[] = ['germany', 'uae', 'usa', 'japan', 'korea', 'belgium']
export const carStatuses: CarStatus[] = ['available', 'inTransit', 'reserved', 'sold']
