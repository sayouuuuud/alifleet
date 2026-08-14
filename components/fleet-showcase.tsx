'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { PageImages } from '@/lib/wp/page-images'

gsap.registerPlugin(ScrollTrigger)

export function FleetShowcase({ wpImages }: { wpImages?: PageImages }) {
  const sectionRef = useRef<HTMLElement>(null)
  const { t } = useLanguage()

  const vehicles = [
    {
      title: t.home.fleet.truckTitle,
      tag: t.home.fleet.truckTag,
      description: t.home.fleet.truckDesc,
      image: wpImages?.fleetVehicle1 || '/images/fleet-van.png',
      alt: t.home.fleet.truckTitle,
    },
    {
      title: t.home.fleet.vanTitle,
      tag: t.home.fleet.vanTag,
      description: t.home.fleet.vanDesc,
      image: wpImages?.fleetVehicle2 || '/images/fleet-suv.png',
      alt: t.home.fleet.vanTitle,
    },
    {
      title: t.home.fleet.luxuryTitle,
      tag: t.home.fleet.luxuryTag,
      description: t.home.fleet.luxuryDesc,
      image: wpImages?.fleetVehicle3 || '/images/fleet-truck.png',
      alt: t.home.fleet.luxuryTitle,
    },
  ]

  useGSAP(
    () => {
      gsap.from('[data-fleet-heading] > *', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-fleet-heading]',
          start: 'top 85%',
        },
      })

      gsap.from('[data-fleet-panel]', {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-fleet-panels]',
          start: 'top 85%',
        },
      })
    },
    { scope: sectionRef }
  )

  const [active, setActive] = useState(0)

  return (
    <section ref={sectionRef} id="fleet" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div data-fleet-heading className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t.home.fleet.eyebrow}
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t.home.fleet.titleStart}{' '}
              <em className="font-serif italic text-accent">{t.home.fleet.titleEm}</em>{' '}
              {t.home.fleet.titleEnd}
            </h2>
          </div>
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            {t.home.fleet.lead}
          </p>
        </div>

        <div
          data-fleet-panels
          className="flex h-[520px] flex-col gap-3 md:h-[560px] md:flex-row"
        >
          {vehicles.map((vehicle, i) => {
            const isActive = active === i
            return (
              <article
                key={vehicle.title}
                data-fleet-panel
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                tabIndex={0}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl outline-none transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive ? 'flex-[5]' : 'flex-[1]'
                }`}
              >
                <Image
                  src={vehicle.image}
                  alt={vehicle.alt}
                  fill
                  // Only the first panel is above the fold in most viewports;
                  // the rest load lazily instead of pulling ~3 MB up front.
                  loading={i === 0 ? 'eager' : 'lazy'}
                  priority={i === 0}
                  quality={80}
                  className={`object-cover transition-transform duration-500 ease-out ${
                    isActive ? 'scale-100' : 'scale-105'
                  }`}
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                {/* Dark gradient for text legibility */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                />

                <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  {vehicle.tag}
                </span>

                {/* Collapsed label — vertical title shown when the panel is idle */}
                <span
                  className={`pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-lg font-semibold uppercase tracking-wide text-white transition-opacity duration-300 [writing-mode:vertical-rl] md:block ${
                    isActive ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {vehicle.title}
                </span>

                {/* Expanded content */}
                <div
                  className={`absolute inset-0 flex flex-col justify-end p-6 transition-all duration-500 md:p-8 ${
                    isActive
                      ? 'translate-y-0 opacity-100 delay-150'
                      : 'pointer-events-none translate-y-4 opacity-0 md:opacity-0'
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-2xl font-semibold text-white md:text-3xl">
                    {vehicle.title}
                    <ArrowUpRight className="size-6 text-accent" />
                  </h3>
                  <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-white/85 md:text-base">
                    {vehicle.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
