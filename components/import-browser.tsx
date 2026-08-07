'use client'

import { useMemo, useState } from 'react'
import { carOrigins, carStatuses } from '@/lib/data/import-cars'
import type { CarOrigin, CarStatus, ImportCar } from '@/lib/data/import-cars'
import type { VehiclesStatus } from '@/lib/wp/vehicles'
import { useLanguage } from '@/lib/i18n/language-context'
import { ImportCarCard } from '@/components/import-car-card'
import Link from 'next/link'

type Props = {
  cars: ImportCar[]
  status: VehiclesStatus
}

export function ImportBrowser({ cars, status }: Props) {
  const { t } = useLanguage()
  const [origin, setOrigin] = useState<CarOrigin | 'all'>('all')
  const [carStatus, setCarStatus] = useState<CarStatus | 'all'>('all')

  const filtered = useMemo(
    () =>
      cars.filter(
        (car) =>
          (origin === 'all' || car.origin === origin) &&
          (carStatus === 'all' || car.status === carStatus)
      ),
    [cars, origin, carStatus]
  )

  const chip = (active: boolean) =>
    active
      ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
      : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary hover:text-foreground'

  /* ---------- empty / error states served from server data ---------- */
  if (status === 'not_configured' || status === 'unreachable') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="font-semibold text-foreground">
            {t.import.inventoryUnavailable}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.import.inventoryUnavailableLead}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.callUs}
          </Link>
        </div>
      </section>
    )
  }

  if (status === 'acf_missing') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <p className="font-semibold text-foreground">
            {t.import.inventoryAcfMissing}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.import.inventoryAcfMissingLead}
          </p>
        </div>
      </section>
    )
  }

  if (status === 'empty') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="font-semibold text-foreground">
            {t.import.inventoryEmpty}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.import.inventoryEmptyLead}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.callUs}
          </Link>
        </div>
      </section>
    )
  }

  /* ---------- normal grid ---------- */
  return (
    <section id="available" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
        {t.import.listEyebrow}
      </p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
        {t.import.listTitle}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
        {t.import.listLead}
      </p>

      <div className="mt-10 flex flex-col gap-5 border-y border-border py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.import.filterOrigin}
          </span>
          <button type="button" onClick={() => setOrigin('all')} className={chip(origin === 'all')}>
            {t.common.all}
          </button>
          {carOrigins.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setOrigin(item)}
              className={chip(origin === item)}
            >
              {t.import.origins[item]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.import.filterStatus}
          </span>
          <button
            type="button"
            onClick={() => setCarStatus('all')}
            className={chip(carStatus === 'all')}
          >
            {t.common.all}
          </button>
          {carStatuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCarStatus(item)}
              className={chip(carStatus === item)}
            >
              {t.import.status[item]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <span dir="ltr">{filtered.length}</span> {t.common.resultsCount}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="text-muted-foreground">{t.common.noResults}</p>
          <button
            type="button"
            onClick={() => {
              setOrigin('all')
              setCarStatus('all')
            }}
            className="mt-4 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.clearFilters}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((car) => (
            <ImportCarCard key={car.slug} car={car} />
          ))}
        </div>
      )}
    </section>
  )
}
