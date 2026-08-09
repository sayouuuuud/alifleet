'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, MessageCircle, Phone } from 'lucide-react'
import type { ImportCar } from '@/lib/data/import-cars'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatNumber, formatPrice } from '@/lib/format'
import { whatsappLink } from '@/lib/site-config'
import { useStore } from '@/lib/store-context'
import { ImportCarCard } from '@/components/import-car-card'

export function ImportCarDetail({ car, related }: { car: ImportCar; related: ImportCar[] }) {
  const { t, locale } = useLanguage()
  const store = useStore()
  const images = [{ src: car.image, alt: car.alt }, ...car.gallery]
  const [active, setActive] = useState(0)

  const steps = [
    t.import.step1Title,
    t.import.step2Title,
    t.import.step3Title,
    t.import.step4Title,
  ]

  const specs = [
    { label: t.import.year, value: String(car.year), ltr: true },
    { label: t.import.mileage, value: `${formatNumber(car.mileage)} km`, ltr: true },
    { label: t.import.engine, value: car.specs.engine, ltr: true },
    { label: t.import.transmission, value: car.specs.transmission[locale] },
    { label: t.import.fuel, value: car.specs.fuel[locale] },
    { label: t.import.drivetrain, value: car.specs.drivetrain, ltr: true },
    { label: t.import.colorLabel, value: car.specs.color[locale] },
    { label: t.import.seats, value: String(car.specs.seats), ltr: true },
  ]

  const enquiry = `${t.importDetail.whatsappIntro}\n\n${car.model} · ${car.year}\n${t.import.origins[car.origin]}\n${typeof window === 'undefined' ? '' : window.location.href}`

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-28 md:px-8 md:pt-36">
        <Link
          href="/cars#import"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" data-flip-rtl />
          {t.common.backToImport}
        </Link>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          {/* Gallery */}
          <div>
            <div className="relative aspect-16/10 overflow-hidden rounded-3xl bg-secondary ring-1 ring-border">
              <Image
                src={images[active].src || '/placeholder.svg'}
                alt={images[active].alt[locale]}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`${t.importDetail.gallery} ${index + 1}`}
                    aria-current={index === active}
                    className={
                      index === active
                        ? 'relative aspect-4/3 w-24 overflow-hidden rounded-xl ring-2 ring-accent'
                        : 'relative aspect-4/3 w-24 overflow-hidden rounded-xl ring-1 ring-border transition-opacity hover:opacity-80'
                    }
                  >
                    <Image
                      src={image.src || '/placeholder.svg'}
                      alt={image.alt[locale]}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              {t.import.origins[car.origin]} · {car.bodyType[locale]}
            </p>
            <h1 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight text-foreground md:text-5xl">
              {car.model}
            </h1>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              {car.subtitle[locale]}
            </p>

            <div className="mt-7 rounded-3xl bg-card p-6 ring-1 ring-border">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.import.landedPrice}
              </p>
              <p className="mt-1.5 font-serif text-4xl text-foreground" dir="ltr">
                {car.price === null
                  ? t.common.onRequest
                  : formatPrice(car.price, store.currency)}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                {t.import.status[car.status]} · {car.eta[locale]}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {store.whatsapp && (
                  <a
                    href={whatsappLink(enquiry, store.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {t.importDetail.requestThisCar}
                  </a>
                )}
                {store.phoneHref && (
                  <a
                    href={store.phoneHref}
                    className="flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-muted"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {t.common.callUs}
                  </a>
                )}
              </div>
            </div>

            <h2 className="mt-9 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t.importDetail.highlights}
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {car.highlights.map((item) => (
                <li key={item.en} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {item[locale]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Overview + specs */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
              {t.importDetail.overview}
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              {car.description[locale]}
            </p>

            <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t.importDetail.timeline}
            </h3>
            <ol className="mt-5 flex flex-col gap-4">
              {steps.map((step, index) => {
                const done = index + 1 <= car.stage
                return (
                  <li key={step} className="flex items-center gap-3">
                    <span
                      className={
                        done
                          ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground'
                          : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border'
                      }
                    >
                      {done ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <span className="font-mono text-xs" dir="ltr">
                          {index + 1}
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        done
                          ? 'text-sm font-semibold text-foreground'
                          : 'text-sm text-muted-foreground'
                      }
                    >
                      {step}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div>
            <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
              {t.common.specifications}
            </h2>
            <dl className="mt-5 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
              {specs.map((spec, index) => (
                <div
                  key={spec.label}
                  className={
                    index % 2 === 0
                      ? 'flex items-center justify-between gap-4 px-5 py-3.5'
                      : 'flex items-center justify-between gap-4 bg-secondary/50 px-5 py-3.5'
                  }
                >
                  <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                  <dd
                    className="text-sm font-semibold text-foreground"
                    dir={spec.ltr ? 'ltr' : undefined}
                  >
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <h2 className="font-serif text-2xl tracking-tight text-foreground md:text-3xl">
            {t.importDetail.similar}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ImportCarCard key={item.slug} car={item} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
