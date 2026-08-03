'use client'

import { useMemo, useState } from 'react'
import { carOrigins, carStatuses, importCars } from '@/lib/data/import-cars'
import type { CarOrigin, CarStatus } from '@/lib/data/import-cars'
import { useLanguage } from '@/lib/i18n/language-context'
import { ImportCarCard } from '@/components/import-car-card'

export function ImportBrowser() {
  const { t } = useLanguage()
  const [origin, setOrigin] = useState<CarOrigin | 'all'>('all')
  const [status, setStatus] = useState<CarStatus | 'all'>('all')

  const cars = useMemo(
    () =>
      importCars.filter(
        (car) =>
          (origin === 'all' || car.origin === origin) &&
          (status === 'all' || car.status === status)
      ),
    [origin, status]
  )

  const chip = (active: boolean) =>
    active
      ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
      : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary hover:text-foreground'

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
          <button type="button" onClick={() => setStatus('all')} className={chip(status === 'all')}>
            {t.common.all}
          </button>
          {carStatuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={chip(status === item)}
            >
              {t.import.status[item]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <span dir="ltr">{cars.length}</span> {t.common.resultsCount}
      </p>

      {cars.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="text-muted-foreground">{t.common.noResults}</p>
          <button
            type="button"
            onClick={() => {
              setOrigin('all')
              setStatus('all')
            }}
            className="mt-4 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.clearFilters}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <ImportCarCard key={car.slug} car={car} />
          ))}
        </div>
      )}
    </section>
  )
}
