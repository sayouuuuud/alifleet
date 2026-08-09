'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Calendar, Gauge, Users } from 'lucide-react'
import type { SaleCar } from '@/lib/data/sale-cars'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatNumber, formatPrice } from '@/lib/format'
import { useStore } from '@/lib/store-context'
import { proxied } from '@/lib/img-proxy'

const statusStyles: Record<SaleCar['status'], string> = {
  available: 'bg-accent text-accent-foreground',
  reserved: 'bg-secondary text-secondary-foreground ring-1 ring-border',
  sold: 'bg-muted text-muted-foreground ring-1 ring-border',
}

export function SaleCarCard({ car }: { car: SaleCar }) {
  const { t, locale } = useLanguage()
  const store = useStore()

  // A brand-new car has no meaningful odometer reading, so showing "0 km"
  // would read as missing data rather than as a fact.
  const showMileage = car.condition !== 'new'

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-shadow hover:shadow-xl hover:shadow-foreground/5">
      <Link
        href={`/cars/sale/${car.slug}`}
        className="relative block aspect-16/10 overflow-hidden bg-secondary"
      >
        <Image
          src={proxied(car.image)}
          alt={car.alt[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute start-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[car.status]}`}
        >
          {t.cars.saleStatus[car.status]}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t.cars.conditions[car.condition]}
          <span aria-hidden="true">·</span>
          {car.bodyType[locale]}
        </p>

        <h3 className="mt-2 text-pretty text-lg font-semibold leading-snug text-foreground">
          <Link href={`/cars/sale/${car.slug}`} className="hover:text-accent">
            {car.model}
          </Link>
        </h3>
        <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          {car.subtitle[locale]}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-accent" aria-hidden="true" />
            <dt className="sr-only">{t.import.year}</dt>
            <dd dir="ltr">{car.year}</dd>
          </div>
          {showMileage && (
            <div className="flex items-center gap-1.5">
              <Gauge className="size-4 text-accent" aria-hidden="true" />
              <dt className="sr-only">{t.import.mileage}</dt>
              <dd dir="ltr">{formatNumber(car.mileage)} km</dd>
            </div>
          )}
          {car.previousOwners !== null && (
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-accent" aria-hidden="true" />
              <dt className="sr-only">{t.cars.previousOwners}</dt>
              <dd>
                {car.previousOwners === 0 ? (
                  t.cars.firstOwner
                ) : (
                  <span dir="ltr">{car.previousOwners}</span>
                )}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.cars.askingPrice}
            </p>
            <p className="font-serif text-2xl text-foreground" dir="ltr">
              {car.price === null
                ? t.common.onRequest
                : formatPrice(car.price, store.currency)}
            </p>
          </div>
          <Link
            href={`/cars/sale/${car.slug}`}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.viewDetails}
            <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
          </Link>
        </div>
      </div>
    </article>
  )
}
